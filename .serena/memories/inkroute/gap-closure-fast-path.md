# Gap closure fast path

Use this for ordinary GAP-* work.

1. Read the exact GAP_TRACKER.md row.
2. Locate the owner source with Serena only if the file is unknown.
3. Read the smallest owner source/test slice needed for the edit.
4. Patch source command lists, runtime/readiness matrices, artifact helpers, static assertions, package mirrors if present, and tracker wording together.
5. Keep provider, legal, credential, CI, live-browser, mobile-device, and production-resource gates explicit when they cannot be proven locally.

Aggressive closure rule: if a requirement can be represented as a fail-closed guard, command label, matrix row, artifact assertion, static test, redaction helper, or local readiness contract, implement it instead of logging a new blocker.

Default tooling budget: zero Obsidian calls; zero Serena calls when the owner file is already known; one Serena owner lookup when it is not.
## Exact identity seam

For repeated local software-contract gaps, prefer a package-local batch:

1. Find remaining inline `requiredCommands: [` / `requiredControls: [` returns in the package source.
2. Pair each inline contract with the matching static test assertion.
3. Export a named helper for the command/control list.
4. Type the plan field to `typeof helper`.
5. Return the helper identity from the readiness builder.
6. Assert identity with `toBe(helper)` in the static test.
7. Update only the matching GAP_TRACKER.md row with the exact helper name.

Do not ask Serena to confirm an owner once the package source and test are already known. Do not open Obsidian between rows in the same repeated pattern unless an accepted API decision changes the contract.

## Batch stop rule

Stop the batch when the next edit would require credentials, providers, production resources, legal review, mobile devices, browser proof, or CI-only evidence. Preserve that as an external gate in the tracker instead of inventing a new blocker.
