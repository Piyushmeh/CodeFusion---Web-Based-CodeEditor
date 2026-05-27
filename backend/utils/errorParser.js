/**
 * Parse real compiler stderr into structured diagnostics.
 */

function buildPreview(code, line, column = 1) {
  if (!code || !line || line < 1) return null;
  const lines = code.split('\n');
  const idx = line - 1;
  if (idx < 0 || idx >= lines.length) return null;

  const context = [];
  for (let i = Math.max(0, idx - 1); i <= Math.min(lines.length - 1, idx + 1); i++) {
    context.push({
      lineNumber: i + 1,
      text: lines[i],
      isErrorLine: i === idx,
    });
  }

  const gutterWidth = Math.max(...context.map((c) => String(c.lineNumber).length));
  const caretPad = gutterWidth + 3 + Math.max(0, column - 1);
  const caret = `${' '.repeat(caretPad)}^`;

  return { lines: context, caret, gutterWidth };
}

function diag(base) {
  return {
    type: 'compile',
    file: base.file || null,
    line: base.line ?? null,
    column: base.column ?? null,
    message: base.message || 'Unknown error',
    raw: base.raw || '',
    preview: base.preview ?? null,
  };
}

/** Java: Main.java:17: error: ';' expected */
function parseJava(stderr, code, defaultFile) {
  const results = [];
  const re = /^([\w.$]+\.java):(\d+):\s*(?:error:\s*)?(.+)$/gm;
  let m;
  while ((m = re.exec(stderr)) !== null) {
    const line = parseInt(m[2], 10);
    const message = m[3].trim();
    results.push(
      diag({
        file: m[1],
        line,
        column: 1,
        message,
        raw: m[0],
        preview: buildPreview(code, line, 1),
      })
    );
  }
  if (results.length === 0 && stderr.trim()) {
    const fallback = stderr
      .trim()
      .split('\n')
      .filter((l) => l.includes('error'))
      .map((raw) => {
        const fm = raw.match(/([\w.]+\.java):(\d+)/);
        const line = fm ? parseInt(fm[2], 10) : null;
        return diag({
          file: fm?.[1] || defaultFile,
          line,
          message: raw.replace(/^.*error:\s*/i, '').trim() || raw.trim(),
          raw,
          preview: line ? buildPreview(code, line, 1) : null,
        });
      });
    return fallback.length ? fallback : [diag({ file: defaultFile, message: stderr.trim(), raw: stderr })];
  }
  return results;
}

/** g++ / clang: file.cpp:10:5: error: ... */
function parseCpp(stderr, code, defaultFile) {
  const results = [];
  const re = /^(.+?):(\d+):(\d+):\s*(error|warning|note):\s*(.+)$/gm;
  let m;
  while ((m = re.exec(stderr)) !== null) {
    if (m[4] !== 'error') continue;
    const line = parseInt(m[2], 10);
    const column = parseInt(m[3], 10);
    results.push(
      diag({
        file: pathBasename(m[1]),
        line,
        column,
        message: m[5].trim(),
        raw: m[0],
        preview: buildPreview(code, line, column),
      })
    );
  }
  if (results.length === 0 && stderr.trim()) {
    return stderr
      .trim()
      .split('\n')
      .filter((l) => /error/i.test(l))
      .map((raw) => {
        const fm = raw.match(/(.+?):(\d+):(\d+):/);
        const line = fm ? parseInt(fm[2], 10) : null;
        const column = fm ? parseInt(fm[3], 10) : 1;
        return diag({
          file: fm ? pathBasename(fm[1]) : defaultFile,
          line,
          column,
          message: raw.replace(/^.*error:\s*/i, '').trim() || raw.trim(),
          raw,
          preview: line ? buildPreview(code, line, column) : null,
        });
      });
  }
  return results.length
    ? results
    : stderr.trim()
      ? [diag({ file: defaultFile, message: stderr.trim().split('\n')[0], raw: stderr })]
      : [];
}

/** Python: File "main.py", line 17 */
function parsePython(stderr, code, defaultFile) {
  const results = [];
  const lineRe = /File\s+"([^"]+)",\s+line\s+(\d+)/g;
  const lines = [...stderr.matchAll(lineRe)];
  const syntaxRe = /SyntaxError:\s*(.+)/;
  const errorRe = /(\w+Error):\s*(.+)/;

  if (lines.length > 0) {
    const last = lines[lines.length - 1];
    const line = parseInt(last[2], 10);
    const file = pathBasename(last[1]);
    let message = stderr.trim().split('\n').pop() || 'Error';
    const syn = stderr.match(syntaxRe);
    const err = stderr.match(errorRe);
    if (syn) message = syn[1].trim();
    else if (err) message = `${err[1]}: ${err[2].trim()}`;

    results.push(
      diag({
        file,
        line,
        column: 1,
        message,
        raw: stderr,
        preview: buildPreview(code, line, 1),
      })
    );
    return results;
  }

  if (stderr.trim()) {
    return [diag({ file: defaultFile, message: stderr.trim().split('\n').slice(-1)[0], raw: stderr })];
  }
  return [];
}

function pathBasename(p) {
  const parts = p.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1];
}

export function parseCompileDiagnostics(language, stderr, code, fileName) {
  if (!stderr?.trim()) return [];

  const defaultFile = fileName || 'source';

  switch (language) {
    case 'Java':
      return parseJava(stderr, code, defaultFile);
    case 'C++':
      return parseCpp(stderr, code, defaultFile);
    case 'Python':
      return parsePython(stderr, code, defaultFile);
    default:
      return stderr
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((raw) => diag({ file: defaultFile, message: raw.trim(), raw }));
  }
}

export function classifyRunFailure(result) {
  if (result.compile?.timedOut || result.run?.timedOut) {
    return { errorType: 'timeout', title: 'Time Limit Exceeded' };
  }
  if (result.compile?.exitCode !== 0 || result.compile?.stderr?.trim()) {
    return { errorType: 'compile', title: 'Compilation Failed' };
  }
  if (result.run?.stderr?.trim() || (result.run?.exitCode !== 0 && !result.success)) {
    return { errorType: 'runtime', title: 'Runtime Error' };
  }
  if (result.run?.cancelled) {
    return { errorType: 'cancelled', title: 'Execution Cancelled' };
  }
  return { errorType: 'unknown', title: 'Execution Failed' };
}
