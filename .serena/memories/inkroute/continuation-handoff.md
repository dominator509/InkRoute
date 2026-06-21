# InkRoute continuation handoff

Use this when a resumed Codex context, compacted summary, handoff, or prior agent note names the current source/test/tracker seam.

## Admission rule

- Treat the handoff as the task brief, not as evidence.
- Do not open Obsidian for current state.
- Do not ask Serena to reconfirm files already named by the handoff.
- Use Serena only if the handoff names a symbol but the owner or direct exported references are genuinely unknown.

## Resume loop

Use this shortcut when a resumed summary is hot but the route still needs to be handed to another agent:

```powershell
rtk pnpm workflow:route:strict -- "<task text>"
```

1. Read the exact `GAP_TRACKER.md` row named by the handoff.
2. Read the smallest source and static-test slices named by the handoff.
3. Patch the helper identity, artifact identity, command/control list, or static assertion seam.
4. Update only the matching tracker row with exact helper names.
5. Report validation as `not run` unless explicitly requested.

## Stop rule

If the handoff is stale or conflicts with repo evidence, trust the repo slice and continue from the smallest current seam. Do not create a new blocker for tool unavailability, stale memory, or missing live Obsidian context.
