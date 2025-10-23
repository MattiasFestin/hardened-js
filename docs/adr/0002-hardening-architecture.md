# ADR 0002: Hardening architecture

Status: Accepted

Context
-------

The library's goal is to reduce the mutability surface of a JavaScript runtime by freezing constructors, prototypes, and nested objects where safe. The runtime host (Node, browser) may impose readonly or non-configurable properties which make naive freezing brittle.

Decision
--------

- Provide per-target convenience entry points (`hardenAllNode`, `hardenAllBrowser`) that orchestrate a curated list of builtins and environment objects to freeze.
- Implement a defensive traversal utility (`freezeDeep`) which:
  - never throws to the caller; instead records audit failures
  - supports a `skipKeys` option so tests or callers can avoid freezing problematic properties (e.g., `constructor`)
  - traverses prototypes, own properties, symbols, and accessor functions
- Make hardener functions idempotent by swapping the exported binding (or using a module-level guard) after the first successful run.

Consequences
------------

- Freezing operations are robust across a range of hosts but may still be partial depending on host constraints.
- The `freezeDeep` implementation is complex and triggers lint complexity warnings; this is an intentional trade-off for defensive behavior.
