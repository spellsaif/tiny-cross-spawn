import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from '../dist/index.mjs';

describe('spawn and spawnSync drop-in parity', () => {
  it('executes synchronous commands with spawnSync', () => {
    const ret = spawnSync('node', ['-v']);
    assert.equal(ret.status, 0);
    assert.ok(ret.stdout.toString().startsWith('v'));
  });

  it('executes asynchronous commands with streaming events', async () => {
    const cp = spawn('node', ['-v']);
    let stdout = '';

    await new Promise<void>((resolve, reject) => {
      cp.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      cp.on('error', reject);
      cp.on('close', (code) => {
        assert.equal(code, 0);
        assert.ok(stdout.startsWith('v'));
        resolve();
      });
    });
  });

  it('correctly passes arguments with spaces', () => {
    const ret = spawnSync('node', ['-e', 'console.log(process.argv[1])', 'hello world']);
    assert.equal(ret.status, 0);
    assert.equal(ret.stdout.toString().trim(), 'hello world');
  });

  it('handles non-existent binary ENOENT in spawnSync', () => {
    const ret = spawnSync('non_existent_binary_tiny_xyz_999');
    assert.ok(ret.error);
    assert.equal((ret.error as any).code, 'ENOENT');
  });

  it('handles non-existent binary ENOENT in asynchronous spawn', async () => {
    await new Promise<void>((resolve) => {
      const cp = spawn('non_existent_binary_tiny_xyz_999');
      cp.on('error', (err: any) => {
        assert.equal(err.code, 'ENOENT');
        resolve();
      });
    });
  });

  it('preserves function properties for spawn.sync', () => {
    assert.equal(spawn.sync, spawnSync);
    assert.equal(spawn.spawn, spawn);
  });
});
