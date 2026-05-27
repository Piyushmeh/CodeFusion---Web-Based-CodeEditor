import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { TEMP_RUNS_ROOT, ensureTempRoot, removeRunDir } from '../utils/cleanup.js';
import { normalizeStdin } from '../utils/stdin.js';
import { parseCompileDiagnostics, classifyRunFailure } from '../utils/errorParser.js';

const IS_WIN = process.platform === 'win32';
const PYTHON_CMD = IS_WIN ? 'python' : 'python3';
const BIN_EXT = IS_WIN ? '.exe' : '';

export const LIMITS = {
  compileTimeoutMs: 15_000,
  runTimeoutMs: 15_000,
  maxOutputBytes: 65_536,
  maxCodeBytes: 512 * 1024,
};

const SUPPORTED = new Set(['Java', 'Python', 'C++', 'JavaScript']);

let activeRuns = 0;
const MAX_CONCURRENT = 4;
const waitQueue = [];

function acquireSlot() {
  return new Promise((resolve) => {
    if (activeRuns < MAX_CONCURRENT) {
      activeRuns += 1;
      resolve();
      return;
    }
    waitQueue.push(resolve);
  });
}

function releaseSlot() {
  activeRuns = Math.max(0, activeRuns - 1);
  const next = waitQueue.shift();
  if (next) {
    activeRuns += 1;
    next();
  }
}

export function isSupportedLanguage(language) {
  return SUPPORTED.has(language);
}

export function detectJavaClassName(code) {
  const m = code.match(/public\s+class\s+(\w+)/);
  return m ? m[1] : 'Main';
}

function resolveFileName(language, code, fileName) {
  if (language === 'Java') {
    const className = detectJavaClassName(code);
    return `${className}.java`;
  }
  if (language === 'Python') {
    return fileName?.endsWith('.py') ? fileName : 'main.py';
  }
  if (language === 'C++') {
    return fileName?.endsWith('.cpp') || fileName?.endsWith('.cc')
      ? fileName
      : 'main.cpp';
  }
  if (language === 'JavaScript') {
    return fileName?.endsWith('.js') ? fileName : 'script.js';
  }
  return fileName || 'main.txt';
}

function validateCode(code) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    throw new Error('No code to run');
  }
  if (Buffer.byteLength(code, 'utf8') > LIMITS.maxCodeBytes) {
    throw new Error('Code exceeds maximum size (512 KB)');
  }
}

function trimOutput(str, max = LIMITS.maxOutputBytes) {
  if (!str) return '';
  const buf = Buffer.from(str, 'utf8');
  if (buf.length <= max) return str;
  return buf.subarray(0, max).toString('utf8') + '\n...[output truncated]';
}

/**
 * Spawn process; stream raw stdout/stderr chunks without adding newlines.
 * Stdin is written after spawn and closed with end().
 */
function runProcess(command, args, options = {}) {
  const {
    cwd,
    stdin: stdinInput,
    timeoutMs = LIMITS.runTimeoutMs,
    onStdout,
    onStderr,
    env,
    signal,
    pipeStdin = false,
  } = options;

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let outputLimitHit = false;

    const proc = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const killProc = () => {
      try {
        if (IS_WIN) {
          spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], {
            shell: false,
            windowsHide: true,
          });
        } else {
          proc.kill('SIGKILL');
        }
      } catch {
        /* ignore */
      }
    };

    const timeout = setTimeout(() => {
      timedOut = true;
      killProc();
    }, timeoutMs);

    const appendRaw = (chunk, target, emitter) => {
      const text = chunk.toString('utf8');
      if (emitter) emitter(text);
      const next = target + text;
      if (Buffer.byteLength(next, 'utf8') > LIMITS.maxOutputBytes) {
        outputLimitHit = true;
        killProc();
        return trimOutput(next);
      }
      return next;
    };

    proc.stdout?.on('data', (chunk) => {
      stdout = appendRaw(chunk, stdout, onStdout);
    });

    proc.stderr?.on('data', (chunk) => {
      stderr = appendRaw(chunk, stderr, onStderr);
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        stdout: trimOutput(stdout),
        stderr: trimOutput(stderr || err.message),
        exitCode: 1,
        timedOut,
        outputLimitHit,
        spawnError: true,
      });
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (signal?.aborted) {
        resolve({
          stdout: trimOutput(stdout),
          stderr: trimOutput(stderr || 'Execution cancelled.\n'),
          exitCode: 1,
          timedOut: false,
          outputLimitHit,
          cancelled: true,
        });
        return;
      }
      resolve({
        stdout: trimOutput(stdout),
        stderr: trimOutput(stderr),
        exitCode: code ?? 1,
        timedOut,
        outputLimitHit,
      });
    });

    const writeStdin = () => {
      if (!pipeStdin || !proc.stdin) return;
      const data = stdinInput ?? '';
      if (data.length > 0) {
        proc.stdin.write(data, 'utf8', (err) => {
          if (err) console.warn('[compiler] stdin write:', err.message);
          proc.stdin.end();
        });
      } else {
        proc.stdin.end();
      }
    };

    proc.on('spawn', writeStdin);

    if (signal) {
      signal.addEventListener('abort', () => killProc(), { once: true });
    }
  });
}

async function runJava(dir, code, fileName, stdin, hooks, signal) {
  const javaFile = resolveFileName('Java', code, fileName);
  const className = path.basename(javaFile, '.java');

  await fs.writeFile(path.join(dir, javaFile), code, 'utf8');
  hooks.onStatus?.('compiling', 'Compiling Java...');

  const compile = await runProcess('javac', [javaFile], {
    cwd: dir,
    timeoutMs: LIMITS.compileTimeoutMs,
    onStdout: (chunk) => hooks.onStdout?.(chunk, 'compile'),
    onStderr: (chunk) => hooks.onStderr?.(chunk, 'compile'),
    signal,
    pipeStdin: false,
  });

  if (compile.spawnError) {
    return {
      success: false,
      errorType: 'compile',
      message: 'Java compiler (javac) not found. Install JDK and add it to PATH.',
      compile,
    };
  }

  if (compile.exitCode !== 0 || compile.timedOut) {
    return {
      success: false,
      errorType: compile.timedOut ? 'timeout' : 'compile',
      message: compile.timedOut ? 'Compilation timed out' : 'Compilation failed',
      compile,
    };
  }

  hooks.onStatus?.('running', 'Running program...');

  const run = await runProcess('java', ['-cp', dir, className], {
    cwd: dir,
    stdin,
    timeoutMs: LIMITS.runTimeoutMs,
    onStdout: (chunk) => hooks.onStdout?.(chunk, 'run'),
    onStderr: (chunk) => hooks.onStderr?.(chunk, 'run'),
    signal,
    pipeStdin: true,
  });

  if (run.spawnError) {
    return {
      success: false,
      errorType: 'runtime',
      message: 'Java runtime (java) not found. Install JDK and add it to PATH.',
      compile,
      run,
    };
  }

  const success =
    run.exitCode === 0 && !run.timedOut && !run.outputLimitHit && !run.cancelled;

  return {
    success,
    errorType: run.timedOut ? 'timeout' : run.cancelled ? 'cancelled' : success ? null : 'runtime',
    message: run.timedOut
      ? 'Time limit exceeded'
      : run.outputLimitHit
        ? 'Output limit exceeded'
        : run.cancelled
          ? 'Cancelled'
          : success
            ? 'Finished'
            : 'Program exited with errors',
    compile,
    run,
  };
}

async function runCpp(dir, code, fileName, stdin, hooks, signal) {
  const cppFile = resolveFileName('C++', code, fileName);
  const outName = `program${BIN_EXT}`;

  await fs.writeFile(path.join(dir, cppFile), code, 'utf8');
  hooks.onStatus?.('compiling', 'Compiling C++...');

  const compile = await runProcess(
    'g++',
    ['-std=c++17', '-O2', '-o', outName, cppFile],
    {
      cwd: dir,
      timeoutMs: LIMITS.compileTimeoutMs,
      onStdout: (chunk) => hooks.onStdout?.(chunk, 'compile'),
      onStderr: (chunk) => hooks.onStderr?.(chunk, 'compile'),
      signal,
      pipeStdin: false,
    }
  );

  if (compile.spawnError) {
    return {
      success: false,
      errorType: 'compile',
      message: 'C++ compiler (g++) not found. Install MinGW/g++ and add to PATH.',
      compile,
    };
  }

  if (compile.exitCode !== 0 || compile.timedOut) {
    return {
      success: false,
      errorType: compile.timedOut ? 'timeout' : 'compile',
      message: compile.timedOut ? 'Compilation timed out' : 'Compilation failed',
      compile,
    };
  }

  hooks.onStatus?.('running', 'Running program...');

  const run = await runProcess(outName, [], {
    cwd: dir,
    stdin,
    timeoutMs: LIMITS.runTimeoutMs,
    onStdout: (chunk) => hooks.onStdout?.(chunk, 'run'),
    onStderr: (chunk) => hooks.onStderr?.(chunk, 'run'),
    signal,
    pipeStdin: true,
  });

  const success =
    run.exitCode === 0 && !run.timedOut && !run.outputLimitHit && !run.cancelled;

  return {
    success,
    errorType: run.timedOut ? 'timeout' : run.cancelled ? 'cancelled' : success ? null : 'runtime',
    message: run.timedOut
      ? 'Time limit exceeded'
      : run.outputLimitHit
        ? 'Output limit exceeded'
        : run.cancelled
          ? 'Cancelled'
          : success
            ? 'Finished'
            : 'Program exited with errors',
    compile,
    run,
  };
}

async function runPython(dir, code, fileName, stdin, hooks, signal) {
  const pyFile = resolveFileName('Python', code, fileName);
  await fs.writeFile(path.join(dir, pyFile), code, 'utf8');
  hooks.onStatus?.('running', 'Running Python...');

  const run = await runProcess(PYTHON_CMD, ['-u', pyFile], {
    cwd: dir,
    stdin,
    timeoutMs: LIMITS.runTimeoutMs,
    onStdout: (chunk) => hooks.onStdout?.(chunk, 'run'),
    onStderr: (chunk) => hooks.onStderr?.(chunk, 'run'),
    signal,
    pipeStdin: true,
  });

  if (run.spawnError) {
    return {
      success: false,
      errorType: 'runtime',
      message: `${PYTHON_CMD} not found. Install Python and add it to PATH.`,
      run,
    };
  }

  const success =
    run.exitCode === 0 && !run.timedOut && !run.outputLimitHit && !run.cancelled;

  return {
    success,
    errorType: run.timedOut ? 'timeout' : run.cancelled ? 'cancelled' : success ? null : 'runtime',
    message: run.timedOut
      ? 'Time limit exceeded'
      : run.outputLimitHit
        ? 'Output limit exceeded'
        : run.cancelled
          ? 'Cancelled'
          : success
            ? 'Finished'
            : 'Program exited with errors',
    run,
  };
}

async function runJavaScript(dir, code, fileName, stdin, hooks, signal) {
  const jsFile = resolveFileName('JavaScript', code, fileName);
  await fs.writeFile(path.join(dir, jsFile), code, 'utf8');
  hooks.onStatus?.('running', 'Running JavaScript...');

  const run = await runProcess('node', [jsFile], {
    cwd: dir,
    stdin,
    timeoutMs: LIMITS.runTimeoutMs,
    onStdout: (chunk) => hooks.onStdout?.(chunk, 'run'),
    onStderr: (chunk) => hooks.onStderr?.(chunk, 'run'),
    signal,
    pipeStdin: true,
  });

  if (run.spawnError) {
    return {
      success: false,
      errorType: 'runtime',
      message: 'Node.js not found. Install Node.js and add it to PATH.',
      run,
    };
  }

  const success =
    run.exitCode === 0 && !run.timedOut && !run.outputLimitHit && !run.cancelled;

  return {
    success,
    errorType: run.timedOut ? 'timeout' : run.cancelled ? 'cancelled' : success ? null : 'runtime',
    message: run.timedOut
      ? 'Time limit exceeded'
      : run.outputLimitHit
        ? 'Output limit exceeded'
        : run.cancelled
          ? 'Cancelled'
          : success
            ? 'Finished'
            : 'Program exited with errors',
    run,
  };
}

export async function executeCodeStream(params) {
  const { language, code, fileName, stdin: rawStdin = '', hooks = {}, signal } = params;

  if (!isSupportedLanguage(language)) {
    throw new Error(`Language not supported for execution: ${language}`);
  }

  validateCode(code);
  const stdin = normalizeStdin(rawStdin);

  await acquireSlot();

  const runId = randomUUID();
  const dir = path.join(TEMP_RUNS_ROOT, runId);
  const startedAt = Date.now();

  try {
    await ensureTempRoot();
    await fs.mkdir(dir, { recursive: true });

    let result;
    switch (language) {
      case 'Java':
        result = await runJava(dir, code, fileName, stdin, hooks, signal);
        break;
      case 'C++':
        result = await runCpp(dir, code, fileName, stdin, hooks, signal);
        break;
      case 'Python':
        result = await runPython(dir, code, fileName, stdin, hooks, signal);
        break;
      case 'JavaScript':
        result = await runJavaScript(dir, code, fileName, stdin, hooks, signal);
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    const durationMs = Date.now() - startedAt;
    const failure = classifyRunFailure(result);

    const resolvedFile = fileName || resolveFileName(language, code, fileName);
    let diagnostics = [];
    if (!result.success && result.compile?.stderr) {
      diagnostics = parseCompileDiagnostics(language, result.compile.stderr, code, resolvedFile);
    } else if (
      !result.success &&
      language === 'Python' &&
      result.run?.stderr &&
      diagnostics.length === 0
    ) {
      diagnostics = parseCompileDiagnostics(language, result.run.stderr, code, resolvedFile);
    }

    return {
      runId,
      durationMs,
      diagnostics,
      errorType: result.errorType || failure.errorType,
      errorTitle: failure.title,
      ...result,
    };
  } finally {
    await removeRunDir(dir);
    releaseSlot();
  }
}

export function resultToLines(result) {
  const lines = [];
  const { compile, run, success, message } = result;

  if (result.diagnostics?.length) {
    result.diagnostics.forEach((d) => {
      lines.push({
        kind: 'diagnostic',
        diagnostic: d,
      });
    });
  } else if (compile?.stderr?.trim()) {
    lines.push({ kind: 'stderr', stream: 'compile', content: compile.stderr });
  }

  if (run?.stderr?.trim()) {
    lines.push({ kind: 'stderr', stream: 'run', content: run.stderr });
  }

  if (run?.stdout) {
    lines.push({ kind: 'stdout', content: run.stdout });
  } else if (compile?.stdout) {
    lines.push({ kind: 'stdout', content: compile.stdout });
  }

  if (message && !success && !lines.some((l) => l.kind === 'diagnostic' || l.kind === 'stderr')) {
    lines.push({ kind: 'error', type: 'Error', message });
  }

  if (success && !run?.stdout?.trim()) {
    lines.push({ kind: 'info', text: '(program finished with no output)' });
  }

  return lines.length ? lines : [{ kind: 'info', text: message || 'Done.' }];
}
