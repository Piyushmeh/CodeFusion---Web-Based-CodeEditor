/** Strip ANSI escape codes for safe terminal display */
const ANSI_RE = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b[()][0-9;]*[a-zA-Z]/g;

export function stripAnsi(text) {
  if (!text) return '';
  return String(text).replace(ANSI_RE, '');
}

/** Minimal ANSI → HTML (common colors only) */
const ANSI_COLOR_MAP = {
  30: '#a1a1aa',
  31: '#f87171',
  32: '#4ade80',
  33: '#facc15',
  34: '#60a5fa',
  35: '#c084fc',
  36: '#22d3ee',
  37: '#e4e4e7',
  90: '#71717a',
  91: '#fca5a5',
  92: '#86efac',
  93: '#fde047',
  94: '#93c5fd',
  95: '#d8b4fe',
  96: '#67e8f9',
  97: '#fafafa',
};

export function ansiToHtml(text) {
  const plain = stripAnsi(text);
  if (plain === text) {
    return escapeHtml(plain);
  }

  let html = '';
  let open = '';
  const parts = String(text).split(/(\x1b\[[0-9;]*m)/);
  let currentColor = '';

  for (const part of parts) {
    const m = part.match(/^\x1b\[([0-9;]*)m$/);
    if (m) {
      const codes = m[1].split(';').filter(Boolean).map(Number);
      if (codes.includes(0)) {
        open = '';
        currentColor = '';
        continue;
      }
      const colorCode = codes.find((c) => c >= 30 && c <= 97);
      if (colorCode && ANSI_COLOR_MAP[colorCode]) {
        currentColor = ANSI_COLOR_MAP[colorCode];
        open = `<span style="color:${currentColor}">`;
      }
      continue;
    }
    const chunk = escapeHtml(part);
    html += open ? `${open}${chunk}</span>` : chunk;
  }

  return html || escapeHtml(plain);
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
