/**
 * Normalize user stdin for competitive-programming style input.
 * Preserves line breaks; ensures trailing newline when non-empty.
 */
export function normalizeStdin(input) {
  if (input == null || input === '') return '';
  let s = String(input).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!s.endsWith('\n')) {
    s += '\n';
  }
  return s;
}
