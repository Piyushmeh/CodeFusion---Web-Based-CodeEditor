import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TEMP_RUNS_ROOT = path.join(__dirname, '..', 'temp', 'runs');

export async function ensureTempRoot() {
  await fs.mkdir(TEMP_RUNS_ROOT, { recursive: true });
}

export async function removeRunDir(dir) {
  if (!dir) return;
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn('[cleanup] Failed to remove run dir:', dir, err.message);
  }
}

export async function cleanupStaleRuns(maxAgeMs = 60 * 60 * 1000) {
  try {
    await ensureTempRoot();
    const entries = await fs.readdir(TEMP_RUNS_ROOT, { withFileTypes: true });
    const now = Date.now();
    await Promise.all(
      entries
        .filter((e) => e.isDirectory())
        .map(async (e) => {
          const full = path.join(TEMP_RUNS_ROOT, e.name);
          const stat = await fs.stat(full);
          if (now - stat.mtimeMs > maxAgeMs) {
            await removeRunDir(full);
          }
        })
    );
  } catch (err) {
    console.warn('[cleanup] Stale run sweep failed:', err.message);
  }
}
