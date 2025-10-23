# ADR 0004: Runtime Integrity Attestation and User Alerts

Status: Proposed

Context
-------
We want a lightweight way for browser applications to detect runtime tampering (modified built-ins, hijacked host APIs) and notify users, while minimizing runtime overhead and avoiding fragile techniques like proxies or deep recursion into user data.

Decision
--------
Introduce a runtime integrity attestation subsystem that:

- Computes deterministic, shallow fingerprints for a curated set of built-ins and host APIs.
- Aggregates per-object fingerprints into a Merkle-style tree so changes can be localized.
- Computes a time-bucketed hash chain in both main and worker realms so the worker can independently verify main and surface alerts even if main is compromised.
- Worker is the authority: main only posts its measurements. Worker compares and notifies the user (via Service Worker where possible) to avoid a compromised main hiding tampering.

Consequences
------------
- The library will expose small APIs: snapshotTree, diffTrees, enableIntegrityWorker.
- The implementation is intentionally shallow, deterministic, and robust to engine quirks (try/catch, avoid getters and proxies).
- This is tamper-evidence: it helps detect changes but cannot guarantee baseline purity.

Notes
-----
See inline code and tests for specifics. The design favors minimal runtime cost and compatibility across browsers.
