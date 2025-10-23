```markdown
Tech stack for hardened-js

Paths and quick references
- Contribution guidelines: /CONTRIBUTING.md
- Package manifest and scripts: /package.json
- TypeScript config: /tsconfig.json
- Source code: /src/
- Tests: /test/
- ESLint config: /.eslintrc.json

High-level overview

hardened-js is a small TypeScript project that provides utilities to "harden" JavaScript environments by freezing built-ins and prototypes. The repo is intended to produce two bundles (browser and node) and provides a set of pure utilities in `src/utils` that are well-tested.

Languages and runtimes
- TypeScript (ES2020 target) — source files live under `src/`.
- Node.js is used for development and for the Node runtime bundle.
- Browser bundle is produced as an IIFE for direct inclusion on web pages.

Build tooling
- esbuild is used for bundling into single-file browser and node builds. See `package.json` build scripts:
  - `npm run build:node` — node (CommonJS) bundle
  - `npm run build:browser` — browser (IIFE) bundle

Testing and linting
- Vitest is used as the test runner. Tests are under `test/` and are written in TypeScript. Run `npm test` to run tests.
- ESLint (with @typescript-eslint plugin) enforces style rules and the project prefers explicit, defensive, and immutability-friendly patterns (see `/CONTRIBUTING.md`). Run `npm run lint` and `npm run lint:fix`.

Key design choices to mention to contributors
- Prefer pure, functional helpers in `src/utils`. The hardening actions that mutate globals are deliberate exceptions; keep those changes small and well-documented.
- The repository produces two final dist files: `dist/hardenedjs.browser.js` and `dist/hardenedjs.node.js`.

Architecture decisions (ADRs): see `/docs/adr/` for the project's recorded architecture and rationale.

```Tech stack for hardened-js

Paths and quick references
- Contribution guidelines: /CONTRIBUTING.md
- Package manifest and scripts: /package.json
- TypeScript config: /tsconfig.json
- Source code: /src/
- Tests: /test/
- ESLint config: /.eslintrc.json

High-level overview

hardened-js is a small TypeScript project that provides utilities to "harden" JavaScript environments by freezing built-ins and prototypes. The repo is intended to produce two bundles (browser and node) and provides a set of pure utilities in `src/utils` that are well-tested.

Languages and runtimes
- TypeScript (ES2020 target) — source files live under `src/`.
- Node.js is used for development and for the Node runtime bundle.
- Browser bundle is produced as an IIFE for direct inclusion on web pages.

Build tooling
- esbuild is used for bundling into single-file browser and node builds. See `package.json` build scripts:
  - `npm run build:node` — node (CommonJS) bundle
  - `npm run build:browser` — browser (IIFE) bundle

Testing and linting
- Vitest is used as the test runner. Tests are under `test/` and are written in TypeScript. Run `npm test` to run tests.
- ESLint (with @typescript-eslint plugin) enforces style rules and the project prefers explicit, defensive, and immutability-friendly patterns (see `/CONTRIBUTING.md`). Run `npm run lint` and `npm run lint:fix`.

Key design choices to mention to contributors
- Prefer pure, functional helpers in `src/utils`. The hardening actions that mutate globals are deliberate exceptions; keep those changes small and well-documented.
- The repository produces two final dist files: `dist/hardenedjs.browser.js` and `dist/hardenedjs.node.js`.
