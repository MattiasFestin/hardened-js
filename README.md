# hardened-js

A small, focused toolkit to "harden" a JavaScript runtime by freezing built-ins and web APIs so they can't be tampered with at runtime.

This project provides lightweight helpers to make global builtins and environment objects immutable (as much as the host allows). It also includes helpers to remove or neutralize selected globals (`removeAllBrowser` and `removeAllNode`) when you want to shrink the available global surface for untrusted code. It's useful in security-conscious apps, sandboxing layers, or any environment where you want to reduce the attack surface from prototype/pollution or accidental mutation.

## Why harden built-ins?

- JavaScript environments expose powerful globals (Object, Function, Array, Promise, Buffer, etc.). If those are mutated at runtime by third-party code, it can cause surprising behavior and security issues.
- Freezing key globals and their prototypes prevents accidental or malicious mutation of fundamental behavior.
- This library offers pragmatic, defensive freezing with test flags so you can apply it safely in Node, browser, or hybrid environments.

## Features

- Harden ECMAScript built-ins: freeze constructors, prototypes, accessors and nested objects where safe.
- Public convenience APIs (preferred):
  - `hardenAllBrowser(opts?)` — freeze a browser-like global's builtins and Web APIs (recommended for browser environments)
  - `hardenAllNode(opts?)` — freeze Node's globals and common runtime objects (recommended for Node environments)
- Defensive traversal: internal `freezeDeep()` is written to catch host errors and record audit failures instead of crashing.
- Idempotent: the public hardener functions are idempotent (subsequent calls are no-ops).

## Quick start

Install (for development / tests):

```bash
npm install
```

Run tests:

```bash
npm test
```

## Usage examples

Basic browser hardening:

```ts
import { hardenAllBrowser } from 'hardened-js';

// Freeze common Web APIs and builtins in a browser-like global
hardenAllBrowser({ ignoreReadonlyConstructorError: true });

// Subsequent calls are no-ops.
```

Basic Node hardening:

```ts
import { hardenAllNode } from 'hardened-js';

// Freeze Node globals; pass a conservative skip list if needed
hardenAllNode({ skip: ['module', 'require', 'process'], ignoreReadonlyConstructorError: true });
```

Note: The `skip` option is useful in tests or constrained environments where freezing some loader internals would destabilize the runtime.

## API

- `hardenAllBrowser(opts?: { ignoreReadonlyConstructorError?: boolean })`
  - Public: freezes common Web APIs and builtins in a browser-like global. `ignoreReadonlyConstructorError` installs a temporary handler to swallow some host-specific readonly constructor errors during the run.
- `hardenAllNode(opts?: { skip?: string[]; ignoreReadonlyConstructorError?: boolean })`
  - Public: freezes Node/host globals. `skip` is a list of global names to skip (e.g., `['module','require']`).

Removal helpers

- `removeAllBrowser(paths?: string[])`
  - Public: removes or neutralizes the listed top-level paths from a browser-like global (for example, `['fetch','WebSocket']`). The function returns a report (see example usage in code). It's useful for shrinking the global surface exposed to untrusted code.
- `removeAllNode(paths?: string[])`
  - Public: removes or neutralizes the listed top-level paths from the Node global environment (for example, `['require','process']`). Use with care — removing essential Node globals will break code that expects them.

## Notes and caveats

- Freezing built-ins is a powerful operation and may break libraries that rely on modifying prototypes. Use with care and test thoroughly.
- Some host internals are purposely skipped or guarded because freezing them can destabilize the runtime (especially in Node).
- The library uses defensive patterns: it catches traversal errors and records audit failures rather than throwing in most cases.

## Development & contributing

- Follow rules in `CONTRIBUTING.md`: explicit-braces style, defensive programming, and tests in `test/`.
- Run lint and tests locally:

```bash
npm run lint
npm test
```

## CI

- GitHub Actions workflow is included in `.github/workflows/ci.yml` — it runs lint and the test suite on push and pull requests.

## End-to-end (E2E) browser tests

This project includes Playwright-based E2E tests that run the library inside real browsers and assert runtime hardening behavior.

To run the E2E tests locally:

1. Build the browser bundle:

```bash
npm run build
```

2. Install Playwright browsers (once):

```bash
npx playwright install
```

3. Run Playwright tests (Chromium):

```bash
npm run test:e2e:ci
```

There are two npm scripts you can use:

- `npm run test:e2e` — runs Playwright test runner (interactive)
- `npm run test:e2e:ci` — runs Playwright tests in CI-like mode (headless, Chromium)

If you run Playwright in CI, ensure the workflow installs browsers (see Playwright docs) or include `npx playwright install --with-deps` as part of your CI steps.

## License

- MIT

## Acknowledgements

- Designed for environments that need a small, explicit, auditable hardening step for JS runtime safety.
# hardened-js