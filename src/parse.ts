import fs from 'node:fs';
import path from 'node:path';
import { escapeCommand, escapeArgument } from './escape';

const isWin = process.platform === 'win32';
const isExecutableRegExp = /\.(?:com|exe)$/i;
const isCmdShimRegExp = /node_modules[\\/]\.bin[\\/][^\\/]+\.cmd$/i;

export interface ParsedCommand {
  command: string;
  args: string[];
  options: any;
  file?: string;
  original: {
    command: string;
    args: string[];
  };
}

/**
 * Extracts a shebang command from the first 128 bytes of a file.
 */
export function readShebang(filePath: string): string | null {
  let fd: number | undefined;
  try {
    const buf = Buffer.alloc(128);
    fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buf, 0, 128, 0);
    fs.closeSync(fd);
    fd = undefined;

    if (bytesRead < 2 || buf[0] !== 0x23 || buf[1] !== 0x21) {
      return null;
    }

    const content = buf.toString('utf8', 0, bytesRead);
    const newlineIdx = content.indexOf('\n');
    const firstLine = (newlineIdx !== -1 ? content.slice(0, newlineIdx) : content)
      .replace(/\r$/, '')
      .trim();

    const match = firstLine.match(/^#!\s*(.*)$/);
    if (!match || !match[1]) {
      return null;
    }

    let shebang = match[1].trim();
    const envMatch = shebang.match(/^(?:(?:\/usr)?\/bin\/)?env(?:\s+-\S+)*\s+(.*)$/);
    if (envMatch && envMatch[1]) {
      shebang = envMatch[1].trim();
    }

    return shebang || null;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {}
    }
  }
}

function getEnvValue(env: Record<string, string | undefined>, targetKey: string): string | undefined {
  const lower = targetKey.toLowerCase();
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() === lower) {
      return env[key];
    }
  }
  return undefined;
}

function checkFile(candidate: string): string | undefined {
  try {
    const stat = fs.statSync(candidate);
    if (stat.isFile()) {
      return candidate;
    }
  } catch {}
  return undefined;
}

/**
 * Resolves a command against PATH and PATHEXT in a zero-dependency manner.
 */
export function resolveCommand(parsed: ParsedCommand, withoutPathExt = false): string | undefined {
  const env = parsed.options.env || process.env;
  const cwd = parsed.options.cwd ? path.resolve(String(parsed.options.cwd)) : process.cwd();
  const command = parsed.command;

  const pathValue = getEnvValue(env, 'PATH') || '';
  const pathextValue = getEnvValue(env, 'PATHEXT') || '.COM;.EXE;.BAT;.CMD';
  const pathextList = pathextValue.split(';').filter(Boolean);

  const testCandidate = (basePath: string): string | undefined => {
    if (withoutPathExt) {
      return checkFile(basePath);
    }

    const direct = checkFile(basePath);
    if (direct) {
      return direct;
    }

    const ext = path.extname(basePath).toUpperCase();
    if (pathextList.some((pe) => pe.toUpperCase() === ext)) {
      return direct;
    }

    for (const pe of pathextList) {
      const match = checkFile(basePath + pe.toLowerCase()) || checkFile(basePath + pe.toUpperCase());
      if (match) {
        return match;
      }
    }

    return undefined;
  };

  const hasDir = command.includes('/') || command.includes('\\');

  if (hasDir) {
    const candidate = path.resolve(cwd, command);
    return testCandidate(candidate);
  }

  const dirs = pathValue.split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    const resolvedDir = path.resolve(cwd, dir);
    const candidate = path.join(resolvedDir, command);
    const resolved = testCandidate(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return undefined;
}

function detectShebang(parsed: ParsedCommand): string | undefined {
  parsed.file = resolveCommand(parsed) || resolveCommand(parsed, true);

  const shebang = parsed.file ? readShebang(parsed.file) : null;

  if (shebang) {
    parsed.args.unshift(parsed.file!);
    parsed.command = shebang;
    return resolveCommand(parsed) || resolveCommand(parsed, true);
  }

  return parsed.file;
}

function parseNonShell(parsed: ParsedCommand): ParsedCommand {
  if (!isWin) {
    return parsed;
  }

  const commandFile = detectShebang(parsed);
  const needsShell = !isExecutableRegExp.test(commandFile || '');

  if (parsed.options.forceShell || needsShell) {
    const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile || '');

    parsed.command = path.normalize(parsed.command);
    parsed.command = escapeCommand(parsed.command);
    parsed.args = parsed.args.map((arg) => escapeArgument(arg, needsDoubleEscapeMetaChars));

    const shellCommand = [parsed.command, ...parsed.args].join(' ');

    parsed.args = ['/d', '/s', '/c', `"${shellCommand}"`];
    parsed.command = process.env.comspec || process.env.ComSpec || 'cmd.exe';
    parsed.options.windowsVerbatimArguments = true;
  }

  return parsed;
}

export function parse(command: string, args?: any, options?: any): ParsedCommand {
  if (args && !Array.isArray(args)) {
    options = args;
    args = null;
  }

  const clonedArgs = args ? (args as string[]).slice(0) : [];
  const clonedOptions = Object.assign({}, options);

  const parsed: ParsedCommand = {
    command,
    args: clonedArgs,
    options: clonedOptions,
    file: undefined,
    original: {
      command,
      args: clonedArgs.slice(0),
    },
  };

  return clonedOptions.shell ? parsed : parseNonShell(parsed);
}

export default parse;
