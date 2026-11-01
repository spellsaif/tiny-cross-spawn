/**
 * Windows cmd.exe metacharacters that require caret (^) escaping.
 * Matches /([()\][%!^"`<>&|;, *?])/
 */
const META_CHARS = new Set([
  '(', ')', '[', ']', '%', '!', '^', '"', '`', '<', '>', '&', '|', ';', ',', ' ', '*', '?'
]);

/**
 * Escapes cmd.exe metacharacters by prefixing them with '^'.
 * Operates in linear O(N) time with zero regex backtracking.
 */
export function escapeMeta(str: string): string {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]!;
    if (META_CHARS.has(ch)) {
      out += '^';
    }
    out += ch;
  }
  return out;
}

/**
 * Escapes a command string for Windows cmd.exe.
 */
export function escapeCommand(arg: string): string {
  return escapeMeta(String(arg));
}

/**
 * Escapes an argument for Windows cmd.exe using deterministic linear O(N) scanning.
 * Immune to catastrophic regex backtracking (CVE-2024-21538).
 *
 * Implements Microsoft CRT (CommandLineToArgvW) quoting rules:
 * 1. 2N+1 backslashes precede an embedded double quote (\").
 * 2. 2N backslashes precede the closing double quote.
 * 3. All other backslashes are preserved literally.
 * 4. Enclosing double quotes are added.
 * 5. Metacharacters are caret-escaped.
 * 6. If doubleEscapeMetaChars is true (cmd-shim), metacharacters are escaped twice.
 */
export function escapeArgument(arg: string | number, doubleEscapeMetaChars?: boolean): string {
  const str = String(arg);

  let result = '';
  let numBackslashes = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]!;
    if (ch === '\\') {
      numBackslashes++;
    } else if (ch === '"') {
      result += '\\'.repeat(numBackslashes * 2 + 1) + '"';
      numBackslashes = 0;
    } else {
      if (numBackslashes > 0) {
        result += '\\'.repeat(numBackslashes);
        numBackslashes = 0;
      }
      result += ch;
    }
  }

  if (numBackslashes > 0) {
    result += '\\'.repeat(numBackslashes * 2);
  }

  result = `"${result}"`;

  result = escapeMeta(result);
  if (doubleEscapeMetaChars) {
    result = escapeMeta(result);
  }

  return result;
}

export const escape = {
  command: escapeCommand,
  argument: escapeArgument,
  escapeCommand,
  escapeArgument,
  escapeMeta,
};

export default escape;
