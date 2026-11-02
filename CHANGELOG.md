# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-11-02

### Fixed
- **Windows Clone Compatibility**: Removed committed dynamic test fixtures with trailing spaces that prevented `git clone` on Windows NTFS filesystems.
- **Windows PATHEXT Resolution**: Fixed `resolveCommand` to evaluate executable candidate extensions from `PATHEXT` (`.bat`, `.cmd`, `.exe`) before falling back to extensionless files.

### Added
- **Multi-OS CI**: Added GitHub Actions matrix testing across Windows, macOS, and Linux on Node.js 22 and 24.

## [1.0.0] - 2026-11-01

### Added
- Initial release: zero-dependency, dual CJS/ESM, ReDoS-safe drop-in replacement for `cross-spawn`.
- 85-test parity suite validating drop-in behavior across POSIX and Windows.
- Immune to catastrophic regex backtracking (CVE-2024-21538) via linear $O(N)$ escaping.
- Full TypeScript declarations (`.d.ts` and `.d.mts`).
