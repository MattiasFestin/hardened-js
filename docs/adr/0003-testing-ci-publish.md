# ADR 0003: Testing, CI and publishing

Status: Accepted

Context
-------

We need reliable tests that don't mutate the test worker environment and an automated pipeline that runs lint, tests, builds and can publish the package safely.

Decision
--------

- Use Vitest for unit tests. For Node-target tests that exercise hardening of globals, use Node's `vm` module to run tests in isolated contexts.
- Bundle a small helper with esbuild for VM-based tests to avoid worker serialization errors.
- CI (GitHub Actions): run lint → tests → build on push/PR; publish to npm on GitHub Release (requires `NPM_TOKEN` secret).

Consequences
------------

- Tests remain fast and deterministic; VM isolation prevents accidental mutation of the test runner's global environment.
- Publishing is gated behind a release which reduces accidental publishes; repo secrets must be configured.
