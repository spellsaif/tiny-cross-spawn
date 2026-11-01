import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parse, readShebang } from '../dist/index.mjs';

describe('parse module', () => {
  it('clones arguments and options immutably', () => {
    const args = ['-v'];
    const opts = { env: { FOO: 'bar' } };
    const parsed = parse('node', args, opts);

    assert.notEqual(parsed.args, args);
    assert.notEqual(parsed.options, opts);
    assert.deepEqual(parsed.original.args, ['-v']);
  });

  it('returns shell commands untouched', () => {
    const parsed = parse('echo 1', { shell: true });
    assert.equal(parsed.command, 'echo 1');
    assert.equal(parsed.options.shell, true);
  });

  it('reads shebang from files accurately', () => {
    const tmpFile = path.join(os.tmpdir(), `test-shebang-${Date.now()}.sh`);
    fs.writeFileSync(tmpFile, '#!/usr/bin/env node\nconsole.log(1);');

    try {
      const shebang = readShebang(tmpFile);
      assert.equal(shebang, 'node');
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});
