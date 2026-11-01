import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeCommand, escapeArgument } from '../dist/index.mjs';

describe('escape module', () => {
  it('escapes simple arguments with enclosing quotes', () => {
    assert.equal(escapeArgument('hello'), '^"hello^"');
    assert.equal(escapeArgument(123), '^"123^"');
  });

  it('escapes spaces and metacharacters', () => {
    assert.equal(escapeArgument('hello world'), '^"hello^ world^"');
    assert.equal(escapeArgument('a&b'), '^"a^&b^"');
    assert.equal(escapeArgument('a|b'), '^"a^|b^"');
    assert.equal(escapeArgument('a^b'), '^"a^^b^"');
  });

  it('escapes quotes and backslashes per CRT rules', () => {
    assert.equal(escapeArgument('foo"bar'), '^"foo\\^"bar^"');
    assert.equal(escapeArgument('foo\\'), '^"foo\\\\^"');
    assert.equal(escapeArgument('foo\\"bar'), '^"foo\\\\\\^"bar^"');
  });

  it('supports cmd-shim double escaping', () => {
    const single = escapeArgument('hello world', false);
    const double = escapeArgument('hello world', true);
    assert.equal(single, '^"hello^ world^"');
    assert.equal(double, '^^^"hello^^^ world^^^"');
  });

  it('proves linear O(N) complexity and ReDoS immunity (CVE-2024-21538)', () => {
    const count = 100_000;
    const malicious = '\\'.repeat(count) + 'a';
    const start = performance.now();
    const result = escapeArgument(malicious);
    const duration = performance.now() - start;

    assert.ok(result.length > count);
    assert.ok(duration < 500, `Expected < 500ms, completed in ${duration}ms`);
  });

  it('escapes commands properly', () => {
    assert.equal(escapeCommand('foo&bar'), 'foo^&bar');
    assert.equal(escapeCommand('foo|bar'), 'foo^|bar');
  });
});
