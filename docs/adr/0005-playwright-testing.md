# ADR 0005: Adopt Playwright for browser end-to-end tests

Date: 2025-10-23

Status: Proposed

Context
- The project provides browser-targeted hardening utilities (hardenAllBrowser/removeAllBrowser). Unit tests with Vitest cover logic but do not exercise real browser environments where subtle differences (web APIs, property descriptors, cross-origin contexts, service workers) matter.
- We need reliable, reproducible end-to-end tests that run headless in CI and locally during development.

Decision
- Adopt Playwright as the project's end-to-end browser testing framework.

Consequences
- Pros:
  - Cross-browser coverage (Chromium, WebKit, Firefox) with a single API.
  - Headless runs suitable for CI and local development.
  - Built-in test runner, fixtures, and debugging aids (trace, video) that help diagnose platform-specific issues.
  - Good TypeScript support and straightforward API for loading local pages and running assertions.

- Cons / Tradeoffs:
  - Adds a devDependency and requires downloading browser binaries (Playwright's install step). We will make this an opt-in devDependency and document how to install browsers in CI.
  - Tests touching Service Workers, Notifications or other privileged APIs may fail in CI without additional configuration; tests should be conservative and focus on core hardening assertions.

Implementation notes
- Add a small Playwright test harness under test/e2e/playwright. Tests will load a minimal HTML fixture that bundles/loads dist/hardenedjs.browser.js (or the local src build during development) and assert that calling `hardenAllBrowser()` freezes or modifies expected builtins.
- Provide npm scripts:
  - "test:e2e": runs Playwright in headless mode.
  - "test:e2e:ci": runs Playwright with recommended CI flags (headless, no-sandbox if necessary).

Safety and scope
- Tests will avoid destructive or flaky checks. They will not attempt to persist browser state. They will assert deterministic, read-only properties (for example: Object.isFrozen(Array.prototype)) and check that removal helpers behave as documented in an isolated iframe.

Future work
- Expand tests to include Service Worker notification flows when CI tooling supports registration and permissions.
- Add GitHub Actions workflow to run Playwright tests across supported browsers.

Decision recorded by: hardened-js maintainers
