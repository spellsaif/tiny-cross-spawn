import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import spawnDefault, { spawn, spawnSync, sync } from '../dist/index.mjs';

describe('CJS / ESM compatibility exports', () => {
  it('supports default import as a callable function', () => {
    assert.equal(typeof spawnDefault, 'function');
    const ret = spawnDefault.sync('node', ['-v']);
    assert.equal(ret.status, 0);
  });

  it('supports named imports for spawn, spawnSync, and sync', () => {
    assert.equal(typeof spawn, 'function');
    assert.equal(typeof spawnSync, 'function');
    assert.equal(typeof sync, 'function');
    const ret = spawnSync('node', ['-v']);
    assert.equal(ret.status, 0);
  });
});
