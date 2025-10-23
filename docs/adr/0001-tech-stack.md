# ADR 0001: Tech stack

Status: Accepted

Context
-------

This project is a small library that runs in Node and browser-like environments. It must be small, auditable, and easy to build and test.

Decision
--------

- Language: TypeScript for type-safety during development and clearer APIs.
- Bundler: esbuild for tiny, fast bundles (both Node CJS and browser IIFE builds).
- Linting: ESLint with @typescript-eslint and standard config to enforce consistent style and guard rails.
- Testing: Vitest for fast unit tests and Node vm-based isolation in tests.
- CI: GitHub Actions to run lint, tests, build and publish.

Consequences
------------

- Fast local development and CI due to esbuild and vitest.
- Some ESLint rules may need to be tuned for defensive code (high complexity warnings for traversal code).
