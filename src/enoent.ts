import type { ChildProcess } from 'node:child_process';
import type { ParsedCommand } from './parse';

const isWin = process.platform === 'win32';

export interface EnoentError extends Error {
  code: 'ENOENT';
  errno: 'ENOENT';
  syscall: string;
  path: string;
  spawnargs: string[];
}

export function notFoundError(
  original: { command: string; args: string[] },
  syscall: string
): EnoentError {
  return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
    code: 'ENOENT' as const,
    errno: 'ENOENT' as const,
    syscall: `${syscall} ${original.command}`,
    path: original.command,
    spawnargs: original.args,
  });
}

export function verifyENOENT(
  status: number | null,
  parsed: ParsedCommand
): EnoentError | null {
  if (isWin && status === 1 && !parsed.file) {
    return notFoundError(parsed.original, 'spawn');
  }
  return null;
}

export function verifyENOENTSync(
  status: number | null,
  parsed: ParsedCommand
): EnoentError | null {
  if (isWin && status === 1 && !parsed.file) {
    return notFoundError(parsed.original, 'spawnSync');
  }
  return null;
}

export function hookChildProcess(cp: ChildProcess, parsed: ParsedCommand): void {
  if (!isWin) {
    return;
  }

  const originalEmit = cp.emit;

  (cp as any).emit = function (this: ChildProcess, name: string | symbol, ...args: any[]): boolean {
    if (name === 'exit') {
      const status = args[0] as number | null;
      const err = verifyENOENT(status, parsed);
      if (err) {
        return (originalEmit as any).call(this, 'error', err);
      }
    }

    return (originalEmit as any).apply(this, [name, ...args]);
  };
}

export const enoent = {
  hookChildProcess,
  verifyENOENT,
  verifyENOENTSync,
  notFoundError,
};

export default enoent;
