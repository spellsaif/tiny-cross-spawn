'use strict';

const test = require('node:test');
const { describe, it, before, after, beforeEach, afterEach } = test;
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const run = require('./util/run');

const isWin = process.platform === 'win32';
const pathKey = Object.keys(process.env).find(k => k.toUpperCase() === 'PATH') || 'PATH';

run.methods.forEach((method) => {
    describe(`cross-spawn parity: [${method}]`, () => {
        const originalPathEnv = process.env[pathKey];

        before(() => {
            fs.mkdirSync(path.join(__dirname, 'tmp'), { recursive: true });
        });

        after(() => {
            fs.rmSync(path.join(__dirname, 'tmp'), { recursive: true, force: true });
        });

        afterEach(() => {
            process.env[pathKey] = originalPathEnv;
        });

        it('should expand using PATHEXT properly', async () => {
            const { stdout } = await run(method, path.join(__dirname, 'fixtures/say-foo'));
            assert.equal(stdout.trim(), 'foo');
        });

        it('should support shebang in executables with `/usr/bin/env`', async () => {
            const { stdout: stdout1 } = await run(method, path.join(__dirname, 'fixtures/shebang'));
            assert.equal(stdout1.trim(), 'shebang works!');

            // Test if the actual shebang file is resolved against options.env.PATH
            const { stdout: stdout2 } = await run(method, 'shebang', {
                env: {
                    ...process.env,
                    [pathKey]: path.normalize(path.join(__dirname, 'fixtures')) + path.delimiter + process.env[pathKey],
                },
            });
            assert.equal(stdout2.trim(), 'shebang works!');

            // Test if the actual shebang file is resolved against process.env.PATH
            process.env[pathKey] = path.normalize(path.join(__dirname, 'fixtures')) + path.delimiter + process.env[pathKey];
            const { stdout: stdout3 } = await run(method, 'shebang');
            assert.equal(stdout3.trim(), 'shebang works!');
        });

        it('should handle commands with special shell chars', async () => {
            const specialSh = path.join(__dirname, 'fixtures/()%!^&;, ');
            const specialBat = path.join(__dirname, 'fixtures/()%!^&;, .bat');

            fs.writeFileSync(
                specialSh,
                fs.readFileSync(path.join(__dirname, 'fixtures/pre_()%!^&;, .sh')),
                { mode: 0o0777 }
            );
            fs.writeFileSync(
                specialBat,
                fs.readFileSync(path.join(__dirname, 'fixtures/pre_()%!^&;, .bat'))
            );

            const { stdout } = await run(method, specialSh);
            assert.equal(stdout.trim(), 'special');
        });

        it('should handle empty arguments and arguments with spaces', async () => {
            const { stdout } = await run(method, 'node', [
                path.join(__dirname, 'fixtures/echo.js'),
                'foo',
                '',
                'bar',
                'André Cruz',
            ]);
            assert.equal(stdout.trim(), 'foo\n\nbar\nAndré Cruz');
        });

        it('should handle non-string arguments', async () => {
            const { stdout } = await run(method, 'node', [
                path.join(__dirname, 'fixtures/echo.js'),
                1234,
            ]);
            assert.equal(stdout.trim(), '1234');
        });

        it('should handle arguments with shell special chars', async () => {
            const args = [
                'foo',
                '()',
                'foo',
                '[]',
                'foo',
                '%!',
                'foo',
                '^<',
                'foo',
                '>&',
                'foo',
                '|;',
                'foo',
                ', ',
                'foo',
                '!=',
                'foo',
                '\\*',
                'foo',
                '"f"',
                'foo',
                '?.',
                'foo',
                '=`',
                'foo',
                '\'',
                'foo',
                '\\"',
                'bar\\',
                '"foo|bar>baz"',
                '"(foo|bar>baz|foz)"',
            ];

            const { stdout } = await run(method, 'node', [path.join(__dirname, 'fixtures/echo.js'), ...args]);
            assert.equal(stdout.trim(), args.join('\n'));
        });

        it('should handle commands with names of environment variables', async () => {
            const { stdout } = await run(method, path.join(__dirname, 'fixtures/%CD%'));
            assert.equal(stdout.trim(), 'special');
        });

        it('should handle optional spawn optional arguments correctly', async () => {
            const { stdout: stdout1 } = await run(method, path.join(__dirname, 'fixtures/say-foo'));
            assert.equal(stdout1.trim(), 'foo');

            const { stdout: stdout2 } = await run(method, path.join(__dirname, 'fixtures/say-foo'), { stdio: 'ignore' });
            assert.equal(stdout2, null);

            const { stdout: stdout3 } = await run(method, path.join(__dirname, 'fixtures/say-foo'), null, { stdio: 'ignore' });
            assert.equal(stdout3, null);
        });

        it('should not mutate args nor options', async () => {
            const args = [];
            const options = {};

            await run(method, path.join(__dirname, 'fixtures/say-foo'), args, options);

            assert.deepEqual(args, []);
            assert.deepEqual(options, {});
        });

        it('should give correct exit code', async () => {
            try {
                await run(method, 'node', [path.join(__dirname, 'fixtures/exit-25.js')]);
                assert.fail('Should have failed with exit code 25');
            } catch (err) {
                assert.equal(err.exitCode, 25);
            }
        });

        it('should work with a relative posix path to a command', async () => {
            const relativeFixturesPath = path.relative(process.cwd(), path.join(__dirname, 'fixtures')).replace(/\\/g, '/');

            const { stdout: stdout1 } = await run(method, `${relativeFixturesPath}/say-foo`);
            assert.equal(stdout1.trim(), 'foo');

            const { stdout: stdout2 } = await run(method, `./${relativeFixturesPath}/say-foo`);
            assert.equal(stdout2.trim(), 'foo');
        });

        it('should work with a relative posix path to a command with a custom `cwd`', async () => {
            const relativeTestPath = path.relative(process.cwd(), __dirname).replace(/\\/g, '/');

            const { stdout: stdout1 } = await run(method, 'fixtures/say-foo', { cwd: relativeTestPath });
            assert.equal(stdout1.trim(), 'foo');

            const { stdout: stdout2 } = await run(method, './fixtures/say-foo', { cwd: `./${relativeTestPath}` });
            assert.equal(stdout2.trim(), 'foo');
        });

        if (run.isMethodSync(method)) {
            it('should fail with ENOENT if the command does not exist', () => {
                assert.throws(() => {
                    run(method, 'somecommandthatwillneverexist', ['foo']);
                }, (err) => {
                    assert.equal(err.code, 'ENOENT');
                    return true;
                });
            });

            it('should NOT fail with ENOENT if the command actually exists but exited with 1', () => {
                try {
                    run(method, path.join(__dirname, 'fixtures/exit-1'));
                } catch (err) {
                    assert.notEqual(err.code, 'ENOENT');
                }
            });

            it('should NOT fail with ENOENT if shebang command does not exist', () => {
                try {
                    run(method, path.join(__dirname, 'fixtures/shebang-enoent'));
                } catch (err) {
                    assert.notEqual(err.code, 'ENOENT');
                }
            });

            it('should fail with ENOENT if non-existing cwd was specified', () => {
                try {
                    run(method, path.join(__dirname, 'fixtures/say-foo'), { cwd: 'somedirthatwillneverexist' });
                } catch (err) {
                    assert.equal(err.code, 'ENOENT');
                }
            });
        } else {
            it('should emit error and close if command does not exist', async () => {
                await new Promise((resolve, reject) => {
                    const promise = run(method, 'somecommandthatwillneverexist', ['foo']);
                    const { cp } = promise;
                    promise.catch(() => {});

                    cp.on('error', (err) => {
                        assert.equal(err.code, 'ENOENT');
                    });
                    cp.on('close', (code) => {
                        assert.notEqual(code, 0);
                        resolve();
                    });
                });
            });

            it('should NOT emit error if the command actually exists but exited with 1', async () => {
                await new Promise((resolve, reject) => {
                    const promise = run(method, path.join(__dirname, 'fixtures/exit-1'));
                    const { cp } = promise;
                    promise.catch(() => {});

                    cp.on('error', () => {
                        reject(new Error('Should not emit error'));
                    });
                    cp.on('close', (code) => {
                        assert.equal(code, 1);
                        resolve();
                    });
                });
            });

            it('should NOT emit error if shebang command does not exist', async () => {
                await new Promise((resolve, reject) => {
                    const promise = run(method, path.join(__dirname, 'fixtures/shebang-enoent'));
                    const { cp } = promise;
                    promise.catch(() => {});

                    cp.on('error', () => {
                        reject(new Error('Should not emit error'));
                    });
                    cp.on('close', (code) => {
                        assert.notEqual(code, 0);
                        resolve();
                    });
                });
            });
        }

        it('should use nodejs spawn when options.shell is specified', async () => {
            const { stdout } = await run(method, 'echo', ['hello'], { shell: true });
            assert.equal(stdout.trim(), 'hello');
        });
    });
});
