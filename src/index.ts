import cp, {
  type ChildProcess,
  type SpawnOptions,
  type SpawnSyncOptions,
  type SpawnSyncReturns,
} from 'node:child_process';
import { parse, readShebang, type ParsedCommand } from './parse';
import { enoent, hookChildProcess, verifyENOENTSync } from './enoent';
import { escape, escapeCommand, escapeArgument } from './escape';

export interface SpawnFunction {
  (command: string, args?: readonly string[], options?: SpawnOptions): ChildProcess;
  (command: string, options?: SpawnOptions): ChildProcess;
  sync: typeof spawnSync;
  spawn: SpawnFunction;
  _parse: typeof parse;
  _enoent: typeof enoent;
  _escape: typeof escape;
}

function spawnImpl(command: string, args?: readonly string[] | SpawnOptions, options?: SpawnOptions): ChildProcess {
  const parsed = parse(command, args as any, options);
  const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
  hookChildProcess(spawned, parsed);
  return spawned;
}

export function spawn(command: string, args?: readonly string[], options?: SpawnOptions): ChildProcess;
export function spawn(command: string, options?: SpawnOptions): ChildProcess;
export function spawn(command: string, args?: any, options?: any): ChildProcess {
  return spawnImpl(command, args, options);
}

export function spawnSync(command: string, args?: readonly string[], options?: SpawnSyncOptions): SpawnSyncReturns<Buffer | string>;
export function spawnSync(command: string, options?: SpawnSyncOptions): SpawnSyncReturns<Buffer | string>;
export function spawnSync(command: string, args?: any, options?: any): SpawnSyncReturns<any> {
  const parsed = parse(command, args, options);
  const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
  result.error = result.error || (verifyENOENTSync(result.status, parsed) as any);
  return result;
}

export const sync = spawnSync;

(spawn as any).sync = spawnSync;
(spawn as any).spawnSync = spawnSync;
(spawn as any).spawn = spawn;
(spawn as any).default = spawn;
(spawn as any)._parse = parse;
(spawn as any)._enoent = enoent;
(spawn as any)._escape = escape;

export { parse, readShebang, enoent, escape, escapeCommand, escapeArgument };
export type { ParsedCommand };

export default spawn as SpawnFunction;
