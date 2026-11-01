<p align="center">
  <img src="https://raw.githubusercontent.com/spellsaif/tiny-cross-spawn/main/logo.png" alt="tiny-cross-spawn logo" width="160" height="160" />
</p>

<h1 align="center">tiny-cross-spawn</h1>

<p align="center">
  <strong>Zero-dependency, dual CommonJS & ESM drop-in replacement for <code>cross-spawn</code>.</strong>
</p>

<p align="center">
  <a href="https://npmjs.com/package/tiny-cross-spawn"><img src="https://img.shields.io/npm/v/tiny-cross-spawn.svg" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/tiny-cross-spawn.svg" alt="license" /></a>
</p>

---

## Why?

For over a decade, [`cross-spawn`](https://github.com/moxystudio/node-cross-spawn) has been the universal foundation for cross-platform process execution across Node.js. 

However, it was originally designed in the Node 0.10 era, pulling in 5 transitive dependencies (`which`, `isexe`, `path-key`, `shebang-command`, `shebang-regex`) and relying on regular expressions for argument escaping that historically introduced ReDoS vulnerabilities (such as CVE-2024-21538).

`tiny-cross-spawn` is a modern, zero-dependency drop-in replacement engineered for current runtimes (Node.js 18+, Bun, and Deno):
- **Zero runtime dependencies**: Pure native `PATHEXT` and shebang resolution using standard library built-ins.
- **Linear O(N) Quoting**: Deterministic character scanning without regex backtracking (immune to ReDoS).
- **Full Dual ESM and CJS support**: Native `exports` map for both `import` and `require()`.
- **Native TypeScript definitions**: Strongly-typed `dist/index.d.ts` included out of the box.
- **Exhaustive Parity**: 100% pass rate against `node-cross-spawn`'s original test suite.
- **Tiny footprint**: ~2.5 KB minified.

## Installation
```bash
npm install tiny-cross-spawn
```

## Usage

### Asynchronous (`spawn`)
```ts
import { spawn } from 'tiny-cross-spawn';

const child = spawn('npm', ['test'], { stdio: 'inherit' });

child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});
```

### Synchronous (`spawnSync` / `spawn.sync`)
```ts
import { spawnSync } from 'tiny-cross-spawn';

const result = spawnSync('npm', ['--version']);
console.log(result.stdout.toString().trim());
```

### CommonJS
```js
const spawn = require('tiny-cross-spawn');
const { spawnSync } = require('tiny-cross-spawn');

const res = spawnSync('node', ['-v']);
console.log(res.stdout.toString());
```

## API Parity with Node & `cross-spawn`
`tiny-cross-spawn` strictly matches the function signatures and return types of Node's native `child_process.spawn` and `node-cross-spawn`:
- `spawn(command, [args], [options]): ChildProcess`
- `spawnSync(command, [args], [options]): SpawnSyncReturns<Buffer | string>`
- `spawn.sync`: Alias to `spawnSync`

## License
MIT © nanasi
