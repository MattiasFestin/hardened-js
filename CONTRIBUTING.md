# Contributing to hardened-js

Thanks for wanting to contribute. This project values clarity, safety, and small, reviewable changes. The guidance below describes how to contribute code, tests and documentation so we can accept your PR quickly.

## Philosophy and coding style

- We prefer a clear, explicit style. Write code that is explicit — code should be self-explanatory.
- Be explicit. Always use curly braces for blocks. Do not rely on implicit single-line bodies.
- Favor defensive programming: validate inputs, fail early, and prefer guard expressions over deep nesting.
- Principle of Least Privilege (POLP): give the smallest scope/permission needed. Keep functions, modules and variables narrow in responsibility and visibility.
- Prefer clear, imperative code over cleverness. Readability matters more than saving a line.

Examples

Good:

```js
if (!user) {
  throw new Error('missing user');
}

for (const item of items) {
  doSomething(item);
}
```

Avoid:

```js
if (!user) throw new Error('missing user');
for (const item of items) doSomething(item);
```

## Defensive patterns we like

- Guard expressions at the start of functions to reduce nesting.
- Explicit argument validation with clear errors.
- Use `const` and `let` appropriately; prefer `const` when values don't change.
- Avoid mutation where practical. If mutation is needed, keep it local and obvious.
- Document assumptions in short comments (not long essays) so reviewers understand intent.

## Functional style and immutability

- Prefer functional, immutable designs where practical. Functions should avoid hidden state and side effects.
- Utility functions (helpers under `src/utils`) should be pure: given the same inputs they should return the same outputs and avoid mutating their arguments.
- We recognise this project necessarily performs mutations when freezing globals and prototypes; those are explicit, deliberate actions. Keep those exceptional and well-documented.
- Prefer returning new objects using object spread or small well-named builders instead of mutating inputs. Use guard clauses and small, composable pure functions.

Examples

Good (pure helper):

```ts
function addId<T extends object>(obj: T, id: string): T & { id: string } {
  return { ...obj, id };
}
```

Avoid (mutating input):

```ts
function addIdInPlace(obj, id) {
  obj.id = id; // avoid unless explicitly intended
  return obj;
}
```

## Tests and quality gates

- All code changes that affect behavior must include unit tests. Tests live in `test/` and are written in TypeScript.
- Run the test suite locally before opening a PR:

```bash
npm test
```

- Lint and type-check locally:

```bash
npm run lint
npm run build
```

If you add new configuration or dev tools, include a short note in the PR explaining why.

## Architecture Decision Records (ADRs)

We record important architecture and technology decisions as Architecture Decision Records (ADRs) in `docs/adr/` so the rationale is discoverable and auditable.

Requirement for new tech / public API changes

Before introducing a new runtime technology, production dependency, or a change that adds or modifies a public API, authors MUST create an ADR that explains:

- Motivation: why the change is needed.
- Alternatives considered and why they were rejected.
- Trade-offs and risks.

Link the ADR from your PR description. This helps reviewers evaluate architectural impact and keeps the project's design history consistent.

## Test-driven development (TDD) workflow

We follow a TDD-first approach for behavioral changes and new features. The preferred workflow:

1. Create types / interfaces that describe the intended input/output shapes.
2. Write a failing test that encodes the desired behavior.
3. Implement the minimal logic to make the test pass.
4. Add another test that fails (iterate).

Testing rules (mandatory):
- Every behavioral change must include at least one positive (happy-path) and one negative (error/edge) test.
- Edge case detection: include tests for boundary conditions, null/undefined inputs, and unexpected types where relevant.
- Tests should be small, fast, and deterministic. Avoid flaky external dependencies in unit tests — use stubs/mocks where necessary.

Example TDD cycle (quick):

```md
# 1. Add types/interfaces
# 2. Write failing test: test/new-feature.test.ts
# 3. Run tests and see failure: npm test
# 4. Implement minimal code to satisfy test
# 5. Re-run tests: npm test
# 6. Add another failing test, repeat
```

## Pull requests

- Keep PRs small and focused. One logical change per PR.
- Use descriptive titles and include a brief description of the motivation and the change.
- Link related issues in the PR description (use `Fixes #NN` when the PR closes an issue).
- Run the test and lint suite locally and include the output or mention if CI passes in your PR comment.

## Code review checklist

Before requesting review, run through this list:

- Does the change follow the explicit-braces, defensive-coding rules above?
- Are the public APIs stable and documented with short comments/examples?
- Are inputs validated and errors reported clearly?
- Are new cases covered by unit tests? Do tests run fast and reliably?
- Is there any security or permission impact? If so, explain and minimise privileges (POLP).
- Is the change small and easy to review (prefer many small PRs over one big one)?

## Commit messages

- Use clear, imperative commit messages, e.g. `fix: validate user input in freezeDeep` or `feat(utils): add safeFreeze`.
- Prefer one subject line and an optional body for longer explanations.

## Branching and CI

- Branch from `main` for work, and open PRs against `main`.
- CI will run tests and linters for each PR. Address failures before requesting final review.

## Formatting and tooling

- We enforce lint rules. Please run `npm run lint` and fix issues before opening a PR.
- If you add or change formatting tools, document the rationale in the PR.

## Questions and help

If you're unsure about an approach or want to make a larger change, open an issue or start a draft PR and tag a reviewer. We're happy to discuss architecture and alternatives before large work begins.

Thanks again — small, explicit, well-tested patches are the fastest way to get merged.


