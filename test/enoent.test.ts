import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { enoent } from '../dist/index.mjs';

const { notFoundError, verifyENOENT, verifyENOENTSync } = enoent;

describe('enoent module', () => {
  it('creates an ENOENT error with standard structure', () => {
    const err = notFoundError({ command: 'invalid-bin', args: ['-a'] }, 'spawn');
    assert.equal(err.code, 'ENOENT');
    assert.equal(err.errno, 'ENOENT');
    assert.equal(err.path, 'invalid-bin');
    assert.deepEqual(err.spawnargs, ['-a']);
    assert.ok(err.message.includes('spawn invalid-bin ENOENT'));
  });

  it('verifies ENOENT behavior based on platform', () => {
    const parsed: any = {
      file: undefined,
      original: { command: 'missing', args: [] },
    };

    if (process.platform === 'win32') {
      const err = verifyENOENT(1, parsed);
      assert.ok(err);
      assert.equal(err?.code, 'ENOENT');
    } else {
      assert.equal(verifyENOENT(1, parsed), null);
      assert.equal(verifyENOENTSync(1, parsed), null);
    }
  });
});
