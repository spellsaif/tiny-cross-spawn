import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
  cjsInterop: true,
  splitting: false,
  footer({ format }) {
    if (format === 'cjs') {
      return {
        js: 'module.exports = spawn; module.exports.default = spawn; module.exports.spawn = spawn; module.exports.sync = spawnSync; module.exports.spawnSync = spawnSync; module.exports.parse = parse; module.exports.enoent = enoent; module.exports.escape = escape;',
      };
    }
    return {};
  },
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
});
