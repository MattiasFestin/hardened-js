Contribution guidance (short)

Reference: full document at `/CONTRIBUTING.md`

Key points to include in a PR or discussion:

- Summary of the change and why it's necessary.
- Files changed and a short explanation of the important lines/blocks.
- Any behavior changes or public API changes (explain rationale).
- Tests added or updated (where to find them under `/test/`).
- Linting and build status (run `npm run lint` and `npm run build`).
- Security or permission implications — state how privileges were minimized (POLP).

Style checklist (quick)
- Always use curly braces for blocks.
- Prefer `const` and avoid `var`.
- Keep functions small; prefer pure helpers in `src/utils`.
- Add unit tests for behavior changes.

If you're unsure about a larger change, open a draft PR or an issue first and reference `/CONTRIBUTING.md`.
