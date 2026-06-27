param(
  [string]$VaultRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) ".obsidian\InkRoute"),
  [switch]$OpenNow,
  [switch]$WithDailyNote,
  [switch]$ForceConfig,
  [switch]$ForceNotes
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$vaultRoot = [IO.Path]::GetFullPath($VaultRoot)
$obsidianDir = Join-Path $vaultRoot ".obsidian"
$projectDir = Join-Path $vaultRoot "Projects\InkRoute"
$templateDir = Join-Path $vaultRoot "Templates"
$dailyDir = Join-Path $projectDir "Daily"
$indexPath = Join-Path $projectDir "Command-Center.md"

New-Item -ItemType Directory -Force -Path $obsidianDir, $projectDir, $templateDir, $dailyDir | Out-Null

function Write-JsonConfigIfNeeded {
  param(
    [Parameter(Mandatory=$true)]
    [string]$Path,
    [Parameter(Mandatory=$true)]
    [object]$Value,
    [int]$Depth = 4
  )

  if ($ForceConfig -or -not (Test-Path $Path)) {
    $Value | ConvertTo-Json -Depth $Depth | Set-Content -Path $Path -Encoding utf8
  }
}

function Write-MarkdownIfNeeded {
  param(
    [Parameter(Mandatory=$true)]
    [string]$Path,
    [Parameter(Mandatory=$true)]
    [string]$Value
  )

  if ($ForceNotes -or -not (Test-Path $Path)) {
    Set-Content -Path $Path -Value $Value -Encoding utf8
  }
}

$appConfig = @{
  alwaysUpdateLinks = $true
  newFileLocation = "folder"
  newFileFolderPath = "Projects/InkRoute"
  attachmentFolderPath = "Attachments"
}
Write-JsonConfigIfNeeded -Path (Join-Path $obsidianDir "app.json") -Value $appConfig -Depth 4

$templatesConfig = @{
  folder = "Templates"
  dateFormat = "YYYY-MM-DD"
  timeFormat = "HH:mm"
}
Write-JsonConfigIfNeeded -Path (Join-Path $obsidianDir "templates.json") -Value $templatesConfig -Depth 4

$hotkeyConfig = @{
  "switcher:open" = @(
    @{
      modifiers = @("Mod")
      key = "O"
    }
  )
  "global-search:open" = @(
    @{
      modifiers = @("Mod", "Shift")
      key = "F"
    }
  )
}
Write-JsonConfigIfNeeded -Path (Join-Path $obsidianDir "hotkeys.json") -Value $hotkeyConfig -Depth 6

$appearanceConfig = @{
  theme = "obsidian"
  accentColor = "#0f766e"
  cssTheme = ""
}
Write-JsonConfigIfNeeded -Path (Join-Path $obsidianDir "appearance.json") -Value $appearanceConfig -Depth 4

$corePluginsConfig = @(
  "file-explorer",
  "global-search",
  "switcher",
  "graph",
  "backlink",
  "canvas",
  "outgoing-link",
  "tag-pane",
  "page-preview",
  "templates",
  "note-composer",
  "command-palette",
  "editor-status",
  "bookmarks",
  "markdown-importer",
  "properties"
)
Write-JsonConfigIfNeeded -Path (Join-Path $obsidianDir "core-plugins.json") -Value $corePluginsConfig -Depth 4

$workspaceConfig = @{
  main = @{
    id = "inkroute-main"
    type = "split"
    children = @(
      @{
        id = "inkroute-left"
        type = "leaf"
        state = @{
          type = "markdown"
          state = @{
            file = "Projects/InkRoute/Command-Center.md"
            mode = "source"
            source = $false
          }
        }
      }
    )
    direction = "vertical"
  }
  left = @{
    id = "inkroute-left-sidebar"
    type = "split"
    children = @(
      @{
        id = "inkroute-files"
        type = "leaf"
        state = @{
          type = "file-explorer"
          state = @{}
        }
      }
    )
    direction = "horizontal"
    width = 300
  }
  right = @{
    id = "inkroute-right-sidebar"
    type = "split"
    children = @(
      @{
        id = "inkroute-backlinks"
        type = "leaf"
        state = @{
          type = "backlink"
          state = @{
            file = "Projects/InkRoute/Command-Center.md"
          }
        }
      }
    )
    direction = "horizontal"
    width = 300
  }
  active = "inkroute-left"
  lastOpenFiles = @(
    "Projects/InkRoute/Command-Center.md",
    "Projects/InkRoute/Quickstart.md",
    "Projects/InkRoute/Route-Packet.md",
    "Projects/InkRoute/Current-Gap-Batch.md",
    "Projects/InkRoute/Continuation-Handoff.md",
    "Projects/InkRoute/Tool-Admission.md",
    "Projects/InkRoute/Exact-Seam-Protocol.md",
    "Projects/InkRoute/Current-Work.md",
    "Projects/InkRoute/Serena-Obsidian-Loop.md",
    "Projects/InkRoute/Repo-Brief.md",
    "Projects/InkRoute/Workflow-Routing.md",
    "Projects/InkRoute/Workflow-Optimizer.md",
    "Projects/InkRoute/One-Shot-Protocol.md",
    "Projects/InkRoute/CI-Fix-Intake.md",
    "Projects/InkRoute/RTK-Command-Recipes.md",
    "Projects/InkRoute/Vault-Safety.md",
    "Projects/InkRoute/Gap-Closure-Dashboard.md",
    "Projects/InkRoute/Decisions.md"
  )
}
Write-JsonConfigIfNeeded -Path (Join-Path $obsidianDir "workspace.json") -Value $workspaceConfig -Depth 12

$bookmarksConfig = @{
  items = @(
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Command-Center.md"
      title = "Command Center"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Quickstart.md"
      title = "Quickstart"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Current-Work.md"
      title = "Current Work"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Tool-Admission.md"
      title = "Tool Admission"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Exact-Seam-Protocol.md"
      title = "Exact Seam"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Serena-Obsidian-Loop.md"
      title = "Serena Loop"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Workflow-Routing.md"
      title = "Workflow Routing"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Workflow-Optimizer.md"
      title = "Workflow Optimizer"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/One-Shot-Protocol.md"
      title = "One-Shot Protocol"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/CI-Fix-Intake.md"
      title = "CI Fix Intake"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Agent-Handoff-Intake.md"
      title = "Handoff Intake"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/RTK-Command-Recipes.md"
      title = "RTK Commands"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Vault-Safety.md"
      title = "Vault Safety"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Gap-Closure-Dashboard.md"
      title = "Gap Closure"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Decisions.md"
      title = "Decisions"
    },
    @{
      type = "file"
      ctime = 0
      path = "Projects/InkRoute/Codex-Reviews.md"
      title = "Codex Reviews"
    }
  )
}
Write-JsonConfigIfNeeded -Path (Join-Path $obsidianDir "bookmarks.json") -Value $bookmarksConfig -Depth 8

$notes = @{
  "Command-Center.md" = @"
# InkRoute command center

Use this as the first note when opening the local vault. It is a router, not evidence.

## Ninety-second route

1. Exact file, route, gap row, or static assertion known: skip Serena and Obsidian.
2. Failing check names the exact missing dependency, file, row, or assertion: patch the named seam.
3. Owner unknown: one Serena owner lookup, then read the smallest repo slice.
4. Shared export changes: one Serena references lookup before patching.
5. Prior accepted decision changes the edit: read one specific InkRoute note.
6. Durable decision, review, or DeepSeek handoff completed: do not browse first; append one concise note after repo evidence is known.

## Evidence budget

- Exact seam: named file/row/test slice only.
- Gap batch: one tracker row, one source slice, one test slice.
- Owner unknown: one Serena owner answer plus located file slice.
- Shared contract: one Serena references answer plus direct call-site slices.
- Obsidian decision: one named project note plus repo evidence.
- Workflow/tooling: router/doc/config/bootstrap surfaces only.

Stop when the done shape is reachable. Do not collect evidence to feel safer after the next patch is obvious.

Operator intake shortcut:

````powershell
rtk pnpm workflow:intake -- "<task text>"
````

Use it for hot resumed contexts, aggressive gap closure, and delegated-agent prompts. It prints strict packet mode. Conditional budgets are guarded fallbacks, not browsing permission.

Tool admission shortcut:

````powershell
rtk pnpm workflow:admit -- "<task text>"
````

Use it when the only decision is whether Serena or Obsidian should be admitted. It prints the quickest classification, live tool ceilings, minimum files, next action, and done shape.

Micro stoplight:

````powershell
rtk pnpm workflow:micro -- "<task text>"
````

Operator alias:

````powershell
rtk pnpm workflow:stoplight -- "<task text>"
````

Use it when even the brief route is too much. It prints only classification, live Serena/Obsidian ceilings, minimum files, next action, and done shape.

Daily note shortcut:

````powershell
rtk pnpm workflow:obsidian:daily
````

This creates today's local scratch note under `Projects/InkRoute/Daily/` without changing repo-owned notes or app settings.

## Open next

- [[Quickstart]] for the shortest Serena/Obsidian/RTK routing card.
- [[Current-Gap-Batch]] for active source/test/tracker closure without reopening tools between rows.
- [[Continuation-Handoff]] for resumed contexts or compacted summaries that already name the current seam.
- [[Current-Work]] for the local work board.
- [[Tool-Admission]] when deciding whether Serena, Obsidian, RTK, or DeepSeek should be used.
- [[Exact-Seam-Protocol]] when the task already names a file, helper, gap row, assertion, package, or CI seam.
- [[Serena-Obsidian-Loop]] for the tool decision tree.
- [[Workflow-Optimizer]] when improving Serena, Obsidian, RTK, router, or vault workflow surfaces.
- [[One-Shot-Protocol]] when the task is starting to sprawl.
- [[CI-Fix-Intake]] when a failing check already names a concrete seam.
- [[Gap-Closure-Dashboard]] for local gap scratch notes.
- [[RTK-Command-Recipes]] for safe command shapes.
- [[Vault-Safety]] before storing any memory.
- [[Agent-Handoff-Intake]] before accepting delegated backend work.
- [[Decisions]] for accepted architecture/API choices.
- [[Codex-Reviews]] for retained review outcomes.
- [[DeepSeek-Handoffs]] for reviewed backend-worker handoffs.

## Hard boundaries

- Repo code, tests, `GAP_TRACKER.md`, and `spec/*` are authoritative.
- Obsidian is project memory, not current-state proof.
- Never store secrets, provider IDs, customer data, PII, raw logs, production URLs, database URLs, or `.env` values.
"@
  "Quickstart.md" = @"
# InkRoute quickstart

Use this first. The optimized workflow is to avoid Serena and Obsidian when the seam is already named.

## Fastest route

Classification priority: explicit workflow/tooling optimization first, exact repo seam second, repeated gap-batch third, owner/reference/memory-read/memory-append lookup last. Generic words like ``script``, ``.md``, ``workflow``, ``Serena``, or ``Obsidian`` are not enough to justify live Serena or Obsidian unless the request is about configuring, optimizing, routing, bootstrapping, or maintaining the tool workflow itself.

Every route must produce a concrete done shape before more evidence is gathered: patch the named seam, protect direct call sites, apply/reject one prior decision against repo truth, align workflow surfaces, or return one precise blocker.

| Signal | Action |
| --- | --- |
| File, helper, route, package, assertion, gap row, script, dependency, or lockfile seam is named | Skip Serena and Obsidian; use RTK on the exact slice. |
| Serena, Obsidian, RTK, local vault, workflow scripts, or workflow routing itself is explicitly the task | Patch known workflow surfaces directly; do not call Serena or Obsidian as ceremony. |
| User says to stop collecting evidence, stop inventing blockers, finish gaps, close gaps, or move aggressively | Collapse to exact-seam or current-gap-batch mode; patch the next local source/test/tracker seam or return one precise non-local blocker. |
| Bare `workflow` means CI or package-script context, without Serena/Obsidian/RTK/routing/vault language | Treat it as an exact repo seam, not workflow/tooling. |
| Repeated source/test/tracker gap-batch seam is in progress | Use [[Current-Gap-Batch]]; do not reopen tools between rows. |
| Owner or route boundary is unknown | Use one Serena owner lookup, then RTK-read the located file. |
| Exported/shared contract changes and call sites are unclear | Use one Serena references lookup, then patch source/tests/direct callers. |
| Prior accepted architecture/API decision changes the implementation or review | Read one specific InkRoute note, then decide from repo evidence. |
| Durable decision, Codex review, or DeepSeek handoff is complete | Append one concise note after the result is known. |

## Serena query shapes

````text
Find the symbol or file that owns <route/function/gap-runtime-name>. Return only likely owner files and exported symbols.
````

````text
Find direct references to <exported-symbol>. Return call sites/tests that would break if the contract changes.
````

````text
Trace <route-path> from handler to service/database boundary. Return handler, validator, auth/tenant checks, and persistence names.
````

## Obsidian route

- [[Command-Center]] for the full router.
- [[Tool-Admission]] when the tool route is unclear.
- [[Exact-Seam-Protocol]] when the seam is already named.
- [[One-Shot-Protocol]] when the task is starting to sprawl.
- [[Vault-Safety]] before writing memory.

Do not use Obsidian for current source, current tests, current tracker state, current diff, CI logs, provider state, secrets, raw logs, production URLs, PII, customer data, or `.env` values.

## Workflow/tooling route

Known workflow surfaces are `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md`, `.serena/project.yml`, `.serena/memories/inkroute/*`, `scripts/workflow/route-serena-obsidian.mjs`, `scripts/bootstrap-obsidian-vault.ps1`, and `package.json` workflow scripts. Patch these directly from repo evidence; refresh the local vault only when requested or when repo-owned vault notes must mirror the new contract.

Use [[Workflow-Optimizer]] for this lane. Do not call live Serena or Obsidian as ceremony for their own workflow configuration.

## RTK commands

Route a fuzzy task before spending semantic or memory tool budget:

````powershell
rtk pnpm workflow:admit -- "<task text>"
````

Use this first when the only question is whether Serena or Obsidian should be admitted.

Strict intake command:

````powershell
rtk pnpm workflow:intake -- "<task text>"
````

Use `workflow:intake` first for resumed, delegated, hot, or evidence-prone tasks. It prints strict packet mode without making the caller remember the longer command name.

Long-form router command:

````powershell
rtk pnpm workflow:route -- "<task text>"
````

Use JSON output for delegated agents or scripts:

````powershell
rtk pnpm workflow:route:json -- "<task text>"
````

Use the smallest human-readable packet when you only need the executable route:

````powershell
rtk pnpm workflow:route:packet -- "<task text>"
````

Use the smallest live-tool stoplight when the only question is whether Serena or Obsidian should be admitted:

````powershell
rtk pnpm workflow:micro -- "<task text>"
````

Operator alias:

````powershell
rtk pnpm workflow:stoplight -- "<task text>"
````

Use the lowest-noise route for hot local tasks where the next action is enough:

````powershell
rtk pnpm workflow:route:brief -- "<task text>"
````

Use the hot route when a resumed, fuzzy, or evidence-prone task needs live and conditional Serena/Obsidian ceilings plus the stop rule:

````powershell
rtk pnpm workflow:route:hot -- "<task text>"
````

Equivalent operator alias:

````powershell
rtk pnpm workflow:hotstart -- "<task text>"
````

Codex-facing hot path:

````powershell
rtk pnpm workflow:codex -- "<task text>"
````

Use the strict packet when the context is hot or the user is pushing against evidence collection:

````powershell
rtk pnpm workflow:route:strict -- "<task text>"
````

Shortcut form:

````powershell
rtk pnpm workflow:route:json -- "<task text>"
````

In JSON mode, use `classification`, `minimumFileSet`, `entrypoints`, `budget.serenaLookups`, `budget.obsidianNotes`, `budget.obsidianReads`, `budget.obsidianWrites`, `budget.conditionalSerenaLookups`, `budget.conditionalObsidianReads`, and `budget.conditionalObsidianWrites` as ceilings, not requirements. Conditional budget fields are guarded fallbacks only when the named condition still exists after the first repo slice.

````powershell
rtk proxy powershell -NoProfile -Command "Get-Content -LiteralPath '<known-file>' | Select-Object -Skip <n> -First <n>"
````

````powershell
rtk proxy powershell -NoProfile -Command "Select-String -LiteralPath '<known-file>' -Pattern '<symbol>'"
````

````powershell
rtk proxy powershell -NoProfile -Command "rg --files '<scope>' | rg '<needle>'"
````

## Stop rule

## Obsidian refresh shortcuts

````powershell
rtk pnpm workflow:obsidian:daily
````

Creates today's local scratch note while preserving existing app settings and repo-owned notes/templates.

````powershell
rtk pnpm workflow:obsidian:daily:open
````

Creates today's local scratch note and opens the local vault.

````powershell
rtk pnpm workflow:obsidian:refresh
````

Refreshes repo-owned notes/templates only.

````powershell
rtk pnpm workflow:obsidian:force-config
````

Refreshes local Obsidian app/workspace/bookmark settings only.

````powershell
rtk pnpm workflow:obsidian:refresh-all
````

Refreshes both repo-owned notes/templates and local app/workspace settings.

If Serena or Obsidian is unavailable, noisy, credential-gated, or ambiguous after one follow-up, stop and use scoped RTK search. Tool friction is not a blocker.

If the user's wording is pushing against evidence collection, do not route that into more tool discovery. The optimized answer is movement: exact slice, patch, honest external gate.
"@
  "Current-Gap-Batch.md" = @"
# InkRoute current gap batch

Use this when a repeated source/test/tracker closure pattern is already in progress. It is an anti-drag card, not evidence.

## Admission rule

- Exact runtime, static test, helper, package, assertion, or `GAP-*` row known: skip Serena and Obsidian.
- Owner unknown after reading the row: one Serena owner lookup, then stop.
- Exported helper changes and direct callers are unclear: one Serena references lookup, then stop.
- Prior accepted API/architecture decision changes the edit: read one specific InkRoute note, then stop.

## Batch loop

1. Read the exact `GAP_TRACKER.md` row.
2. Read the smallest owning source/test slices.
3. Export named command, control, evidence, execution-policy, or external-evidence helpers when inline contracts need identity.
4. Type plans/readiness objects to those helper identities when TypeScript can enforce it.
5. Replace weak `toContain(...)` assertions with identity assertions such as `toBe(helper)` when the contract should expose the exact helper.
6. Update only the matching tracker row with the new helper name.
7. Preserve provider, credential, legal, production, mobile-device, browser, and CI proof as external gates.

## Helper-identity lane

Use this lane for repeated runtime/static-contract work.

1. Locate only the next inline contract or weak assertion in the current scope.
2. Alias package-level required evidence, command, control, or suite helpers when they already exist.
3. Add a local decision builder only when decision evidence extends readiness evidence.
4. Assert readiness identity with `toBe(helper)` and decision arrays through the exported builder.
5. Update the exact `GAP_TRACKER.md` row with helper or builder names.

Do not use broad scans that dump the whole repo. Prefer one scoped queue command, one exact row read, and one source/test read pair.

## Stop conditions

- Do not open Obsidian between rows in a repeated pattern.
- Do not ask Serena to confirm files already named by the row, failing check, or static assertion.
- Do not run validation unless explicitly requested.
- If Serena or Obsidian is noisy, credential-gated, unavailable, or ambiguous after one follow-up, use scoped RTK search and keep moving.
"@
  "Continuation-Handoff.md" = @"
# InkRoute continuation handoff

Use this when a resumed Codex context, compacted summary, handoff, or prior-agent note names the current runtime, static test, tracker row, package loop, helper, assertion, or next target.

## Rule

Treat the handoff as the task brief, not as repo evidence. Repo code, tests, `GAP_TRACKER.md`, and `spec/*` remain authoritative.

## Fast route

1. Skip Obsidian for current state.
2. Skip Serena when the owner source/test/tracker seam is already named.
3. Read only the exact current repo slices: tracker row, source slice, static-test slice, and package mirror only if required.
4. Patch the local helper identity, artifact identity, command/control list, static assertion, or tracker wording seam.
5. Report tests as `not run` unless explicitly requested.

If the handoff is stale or conflicts with repo truth, trust the repo slice and continue from the smallest current seam. Do not turn stale memory, unavailable tools, or missing live vault context into a new blocker.
"@
  "Tool-Admission.md" = @"
# InkRoute tool admission

Use this before opening any other workflow note when the tool route is unclear.

## Default order

1. Exact repo evidence first: known file, route, gap row, assertion, package script, or CI seam.
2. Serena only for one semantic jump when owner, exported references, or direct call-site blast radius is unknown.
3. Obsidian only for one targeted note when a prior accepted decision changes implementation or review.
4. DeepSeek-Claude only for substantial backend implementation with a bounded task brief and Codex review.

## Scorecard

| Tool | Admit only when | Reject when |
| --- | --- | --- |
| Serena | Owner, exported references, or direct call-site blast radius is unknown. | The exact file, route, gap row, helper, assertion, package script, or CI seam is known. |
| Obsidian | A prior accepted InkRoute decision changes the implementation or review. | The question is current source, test, tracker, diff, branch, CI, provider, or runtime state. |
| RTK | Current repo evidence is needed. | The action would mutate secrets, providers, production infra, or run validation without approval. |
| DeepSeek-Claude | Substantial backend implementation needs delegation and Codex can review it. | Frontend/aesthetic work, secrets, provider settings, production infra, or unbounded research is involved. |

If a tool lookup is noisy, credential-gated, unavailable, or ambiguous after one follow-up, stop and use scoped RTK search.

## RTK-first optimizer

- Current repo state belongs to RTK-scoped reads, not Serena or Obsidian.
- Exact file, route, helper, gap row, package script, failing assertion, or lockfile seam means zero Serena and zero Obsidian.
- For a quick tool-admission answer, use `rtk pnpm workflow:admit -- "<task text>"` before opening Serena or Obsidian.
- For fuzzy, resumed, delegated, hot, or evidence-prone tasks, use `rtk pnpm workflow:intake -- "<task text>"` before opening Serena or Obsidian.
- Use `rtk pnpm workflow:route -- "<task text>"` only when you want the longer explanatory route output.
- For delegated agents or scripts, use `rtk pnpm workflow:route:json -- "<task text>"` and treat `minimumFileSet`, `budget`, `evidence`, `done`, and `stopRule` as ceilings.
- For lowest-noise local routing, use `rtk pnpm workflow:route:brief -- "<task text>"` and execute the printed `minimumFiles` and `next` lines directly.
- For compact human-readable routing, use `rtk pnpm workflow:route:packet -- "<task text>"` and execute the printed `minimumFiles` and `next` lines directly.
- The router's `Entrypoints:` line names the shortest lane-specific doc/card/note list.
- The router's `Evidence:` line is a ceiling; the `Done:` line is the expected result shape.
- Use `rtk proxy powershell -NoProfile -Command "<scoped command>"` for PowerShell builtins, pipelines, and exact shell behavior.
- Escape `$` as backtick-dollar inside RTK-proxied PowerShell command strings when launched from Codex or an outer PowerShell.
- Do not add RTK to package scripts, CI workflows, provider automation, or production commands.
- If validation was not explicitly requested, do not run it; report `not run` and offer the next scoped command.
- For delegated agents, prefer `rtk pnpm workflow:route:json -- "<task text>"` and obey `classification`, `minimumFileSet`, `budget.serenaLookups`, and `budget.obsidianNotes` as ceilings.
"@
  "Exact-Seam-Protocol.md" = @"
# InkRoute exact seam protocol

Use this when the task already names a concrete file, helper, route, gap row, package, assertion, fixture, or CI error seam.

## Optimized route

1. Skip Serena.
2. Skip Obsidian.
3. RTK-read the exact repo slice.
4. Patch the smallest source/test/tracker/docs contract.
5. Keep provider, legal, production, credential, device, browser, and CI proof as explicit external gates.
6. Report validation as `not run` unless it was explicitly requested.

## Batch gap closure pattern

- GAP row -> runtime/readiness source -> static assertion -> package mirror if present -> tracker wording.
- Export named `*ExecutionPolicy` and `*RequiredExternalEvidence` helpers when inline.
- Assert helper identity with `toBe(...)` before value-shape assertions.
- Do not reopen Obsidian between similar rows unless a prior accepted architecture/API decision changes the implementation.

## Hard stop

Do not use this note as evidence. Repo code, tests, `GAP_TRACKER.md`, and `spec/*` are authoritative.

## Report shape

- Files changed.
- Local seam closed.
- External gates preserved.
- Validation/tests run, or `not run` when not explicitly requested.
"@
  "Current-Work.md" = @"
# InkRoute current work

Use this as a local working dashboard. Do not treat it as repo evidence.

## Start here

- Repo: `C:\dev\InkRoute`
- Operating contract: `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md`
- Serena shortcut: exact file known means skip; owner unknown means one lookup.
- Obsidian shortcut: read one specific note only when prior history changes the decision.
- Shell shortcut: use `rtk proxy powershell -NoProfile -Command "<command>"`.

## Today

- Focus:
- Repo evidence paths:
- Commands/tests:
- Decision or handoff to append:
- Residual risk:

Never paste secrets, provider IDs, raw logs, PII, customer data, or `.env` values here.
"@
  "Repo-Brief.md" = @"
# InkRoute repo brief

Repo: `C:\dev\InkRoute`

Use this vault as targeted memory only. Current repo state, tests, gap status, and source truth live in the working tree.

## Source of truth

- `AGENTS.md`
- `CLAUDE.md`
- `docs/ai/REPO_BRIEF.md`
- `docs/ai/ARCHITECTURE_MAP.md`
- `docs/ai/API_CONTRACTS.md`
- `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md`
- `GAP_TRACKER.md`
- `spec/PROJECT_STATE.md`
- `spec/HANDOFF.md`
- `spec/HANDOFF_QUEUE.md`

## Daily routing

- Exact file known: skip Serena and Obsidian.
- Owner unknown: one Serena owner/reference lookup, then read the target slice.
- Prior decision matters: read one specific note in `Projects/InkRoute/`.
- Durable decision or review completed: append one concise note after repo evidence is known.

## Safety

Never store secrets, `.env` values, provider IDs, customer data, raw logs, or production credentials in this vault.
"@
  "Architecture.md" = @"
# InkRoute architecture notes

Use this note for accepted architecture decisions only. Link back to repo files instead of copying source.

## Current anchors

- `docs/ai/ARCHITECTURE_MAP.md`
- `docs/ai/API_CONTRACTS.md`
- `packages/*`
- `apps/web`
- `apps/dashboard`
- `apps/mobile`
"@
  "API-Contracts.md" = @"
# InkRoute API contracts

Use this note for durable API-contract decisions and review outcomes. Repo source and tests remain authoritative.

## Anchors

- `docs/ai/API_CONTRACTS.md`
- route handlers under `apps/web`
- validators under `packages/validators`
- shared types under `packages/types`
"@
  "Codex-Reviews.md" = @"
# Codex reviews

Append concise review outcomes here only when the result is worth retaining.

## Template

### YYYY-MM-DD - Scope

- Decision: approved | changes requested | blocked
- Repo evidence: paths only
- Tests/commands: command and result, or not run
- Residual risk: concise
"@
  "DeepSeek-Handoffs.md" = @"
# DeepSeek handoffs

Append backend-worker handoffs here only after Codex reviews scope and risk.

## Template

### YYYY-MM-DD - Task

- Summary:
- Files changed:
- Tests run:
- Remaining gaps:
- Risks:
- Codex review checklist:
"@
  "Decisions.md" = @"
# InkRoute decisions

Record accepted decisions only. Keep current-state claims in repo docs and trackers.

## Template

### DEC-YYYYMMDD-slug

- Decision:
- Context:
- Alternatives:
- Consequences:
- Repo evidence:
"@
  "Workflow-Routing.md" = @"
# InkRoute workflow routing

Use this note as the Obsidian-side mirror of `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md`.

## Ninety-second operating loop

| Minute | Action |
| --- | --- |
| 0-15 seconds | Classify exact-file, owner-unknown, shared-contract, memory-read, memory-append, validation, or review/handoff. |
| 15-45 seconds | Use one Serena lookup only when owner or call sites are unknown. |
| 45-75 seconds | Read the smallest repo slice. |
| 75-90 seconds | Patch from repo evidence; append memory only after a durable result. |

## Default route

- Exact file known: skip Serena and Obsidian.
- Failing check names a missing dependency, file, row, or assertion: patch that exact seam.
- Owner unknown: one Serena owner/reference lookup, then inspect the target file slice.
- Prior architecture/API decision matters: read one specific InkRoute note.
- Durable decision, Codex review, or DeepSeek handoff completed: append one concise note after repo evidence is known; do not browse first.

## Tool route optimizer

| Signal | Optimized route |
| --- | --- |
| Concrete file/helper/route/gap/assertion named | RTK exact slice; no Serena or Obsidian. |
| CI log names dependency, lockfile drift, fixture, package workflow, package script, file, or assertion | Patch that named seam first. |
| Unknown owner or route boundary | One Serena owner lookup, then RTK-read the owner. |
| Exported symbol changes and call sites are unclear | One Serena references lookup. |
| Prior accepted architecture/API decision changes implementation | One targeted Obsidian note, then repo evidence. |
| Tool lookup is noisy, unavailable, credential-gated, or still ambiguous | Stop lookup; scoped RTK search. |

## Never use Obsidian for

- current source truth
- current test state
- gap tracker status
- secrets, provider IDs, raw logs, PII, or `.env` values

Repo artifacts remain authoritative.
"@
  "Workflow-Optimizer.md" = @"
# InkRoute workflow optimizer

Use this when the task names Serena, Obsidian, RTK, workflow routing, local vault cards, or tool admission.

For the phrase ``Optimize workflow with Serena and Obsidian``, route here immediately. This lane optimizes the repo-owned tool workflow; it does not spend live Serena or Obsidian calls.

## Zero-ceremony rule

Do not call live Serena or Obsidian just because the task is about Serena or Obsidian. The owner surfaces are already known:

- `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md`
- `.serena/project.yml`
- `.serena/memories/inkroute/*`
- `scripts/workflow/route-serena-obsidian.mjs`
- `scripts/bootstrap-obsidian-vault.ps1`
- `package.json` workflow scripts

Patch those repo files directly from RTK-scoped evidence.

Bare `workflow`, `Serena`, or `Obsidian` is not enough to enter this lane. Require configuring, optimizing, routing, router, local vault, tool admission, bootstrap, one-shot, or explicit workflow optimization language; otherwise treat it as current repo, CI, owner lookup, or package-script context.

## Keep in sync

When the contract changes, update these together as needed:

1. Executable classifier: ``scripts/workflow/route-serena-obsidian.mjs``.
2. Canonical doc: ``docs/ai/SERENA_OBSIDIAN_WORKFLOW.md``.
3. Serena cards: ``.serena/memories/inkroute/*``.
4. Obsidian bootstrap notes: ``scripts/bootstrap-obsidian-vault.ps1``.

Refresh local vault notes only when repo-owned note templates must mirror the new contract:

```powershell
rtk pnpm workflow:obsidian:refresh
```

Refresh only app/workspace config:

```powershell
rtk pnpm workflow:obsidian:force-config
```

Refresh notes/templates and app/workspace config together:

```powershell
rtk pnpm workflow:obsidian:refresh-all
```

Strict router packet for hot contexts:

```powershell
rtk pnpm workflow:route:strict -- "<task text>"
```

Treat conditional budget fields as guarded fallbacks only. If the owner, direct references, or prior accepted decision is not genuinely unknown after the first repo slice, the budget remains zero in practice.

## Admission ceiling

- Exact seam named: Serena 0, Obsidian 0.
- Owner unknown: Serena 1 owner lookup, Obsidian 0.
- Exported references unclear: Serena 1 references lookup, Obsidian 0 unless a prior API decision matters.
- Prior accepted decision changes implementation or review: Obsidian 1 targeted project note.
- Tool is noisy, unavailable, credential-gated, or ambiguous after one follow-up: stop lookup and use scoped RTK search.
"@
  "Route-Packet.md" = @"
# InkRoute route packet

Use this note when a task is fuzzy enough to justify the local router.

## Command

```powershell
rtk pnpm workflow:intake -- `"<task text>`"
```

Use this first for resumed, delegated, hot, or evidence-prone tasks.

Quick tool-admission form:

```powershell
rtk pnpm workflow:admit -- `"<task text>`"
```

Use this when the decision is only whether Serena or Obsidian should be admitted.

Long form:

```powershell
rtk pnpm workflow:route -- `"<task text>`"
```

For delegated agents and automation:

```powershell
rtk pnpm workflow:route:json -- `"<task text>`"
```

For a compact human-readable packet:

```powershell
rtk pnpm workflow:route:packet -- `"<task text>`"
```

For the smallest live-tool stoplight:

```powershell
rtk pnpm workflow:micro -- `"<task text>`"
```

Operator alias:

```powershell
rtk pnpm workflow:stoplight -- `"<task text>`"
```

For the lowest-noise local route:

```powershell
rtk pnpm workflow:route:brief -- `"<task text>`"
```

For the hot route with conditional ceilings and stop rule:

```powershell
rtk pnpm workflow:route:hot -- `"<task text>`"
```

Equivalent operator alias:

```powershell
rtk pnpm workflow:hotstart -- `"<task text>`"
```

Codex-facing hot path:

```powershell
rtk pnpm workflow:codex -- `"<task text>`"
```

## Packet fields

- `classification`: lane such as workflow-tooling, exact-seam, gap-batch, owner-unknown, shared-contract, obsidian-decision, obsidian-append, validation, or rtk-first.
- `Start`: first useful entrypoint. Open at most this one unless the packet explicitly requires more.
- `Budget`: live Serena and Obsidian ceiling, not a target.
- `minimumFiles`: first-pass file set; read only this coherent set before patching.
- `Evidence`: maximum context before editing.
- `Done`: expected completion shape.
- `Stop rule`: fall back to scoped RTK search when tools are unavailable, credential-gated, noisy, or ambiguous after one follow-up.
- Packet mode prints these fields directly without the longer router explanation.
- Micro mode omits prose, entrypoints, evidence, and stop-rule text. Use it as the fastest admit/reject stoplight for live Serena and Obsidian.

## Rule

Execute the packet. Do not browse all entrypoints, do not treat Obsidian as current repo evidence, and do not use Serena as ceremony when the seam is already named.
"@
  "One-Shot-Protocol.md" = @"
# InkRoute one-shot protocol

Use this when the task is starting to sprawl.

## Rule

One coherent file set, one read pass, one patch pass. Do not turn known seams into research projects.

The evidence budget is a ceiling: if the next edit is clear, patch it. The done shape beats the urge to gather one more confirming artifact.

## Steps

1. Name the smallest coherent file set before editing.
2. Read each required file once.
3. Patch in one pass.
4. Do not re-read changed files just to inspect your own work.
5. Do not run validation unless the user asks.
6. If validation would normally be next, report `not run` and offer to run it.

## Serena admission

- Exact file, gap row, route, helper, dependency, lockfile mismatch, or assertion known: skip Serena.
- Owner unknown: one Serena owner lookup.
- Shared exported contract changes: one Serena references lookup.
- Still ambiguous after one follow-up: use scoped RTK search and move.

## Obsidian admission

- Prior accepted architecture/API decision changes the edit: read one specific note.
- Durable decision, Codex review, or DeepSeek handoff completed: append one concise note.
- Current source, test, branch, diff, tracker, and CI state belong in repo evidence, not Obsidian.
"@
  "CI-Fix-Intake.md" = @"
# CI fix intake

Use this for GitHub Actions or local quality failures.

## Fast route

1. Capture the exact failing check and error seam.
2. If the log names a dependency, file, assertion, package script, or lockfile mismatch, patch that seam first.
3. Skip Serena and Obsidian unless the owner is genuinely unknown.
4. Do not invent new blockers when the failure is already actionable.
5. Do not run validation unless the user asks; record `not run` if skipped.

## Common seams

- `pnpm-lock.yaml` out of sync with `package.json`.
- static test import/assertion drift.
- package script naming drift.
- manifest or tracker row mismatch.
- docs/source-text gate mismatch.

## Result template

- Check:
- Exact error seam:
- Files patched:
- Tests/commands:
- Remaining external gate:
- Risk:
"@
  "RTK-Command-Recipes.md" = @"
# RTK command recipes

Repo shell commands use RTK.

## Known file slice

```powershell
rtk proxy powershell -NoProfile -Command "Get-Content -LiteralPath '<file>' | Select-Object -Skip <n> -First <n>"
```

## Known symbol in a file

```powershell
rtk proxy powershell -NoProfile -Command "Select-String -LiteralPath '<file>' -Pattern '<symbol>'"
```

## Gap row fields from Codex or outer PowerShell

```powershell
rtk proxy powershell -NoProfile -Command "`$line=(Select-String -LiteralPath 'GAP_TRACKER.md' -Pattern '^\| GAP-010 ' | Select-Object -First 1).Line; `$cells=`$line -split '\|'; 0..([Math]::Min(`$cells.Count-1,12)) | ForEach-Object { '[' + `$_ + '] ' + `$cells[`$_].Trim() }"
```

Escape `$` as backtick-dollar inside RTK-proxied PowerShell command strings when launched from Codex or another PowerShell.

## Scoped file discovery

```powershell
rtk proxy powershell -NoProfile -Command "rg --files '<scope>' | rg '<needle>'"
```

## Package command

```powershell
rtk pnpm --filter <package> <script>
```

Do not add RTK requirements to package scripts, CI workflows, provider commands, or production automation unless explicitly approved.
"@
  "Vault-Safety.md" = @"
# Vault safety

This vault is local project memory. It is not current repo evidence.

## Allowed

- Accepted architecture/API decisions.
- Codex review outcomes.
- DeepSeek handoff summaries after Codex review.
- Durable gap-closure notes that preserve local/external evidence boundaries.

## Forbidden

- Secrets, tokens, passwords, `.env` values, database URLs, provider IDs, customer data, PII, raw logs, production URLs, or credentials.
- Current branch, diff, test state, tracker status, or source truth.
- Whole-file source copies from the repo.

Use repo files, tests, `GAP_TRACKER.md`, `spec/*`, and scoped RTK commands for evidence.
"@
  "Agent-Handoff-Intake.md" = @"
# Agent handoff intake

Use this note when converting a DeepSeek-Claude result into a Codex review.

## Intake checklist

- Backend-only scope respected.
- Secrets, `.env`, provider resources, production infrastructure, legal copy, and unrelated UI untouched.
- Tests or static assertions match the changed behavior.
- Tenant/auth/RBAC/data-integrity risks reviewed.
- Tracker/docs wording keeps local proof separate from external provider, CI, device, browser, legal, or credential gates.

Append a final handoff only after Codex review, not before.
"@
  "Serena-Obsidian-Loop.md" = @"
# Serena and Obsidian loop

This is the repo-local fast path. It mirrors `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md` and `.serena/memories/inkroute/routing-contract.md`.

## Classification first

| Task shape | Serena | Obsidian | Next action |
| --- | --- | --- | --- |
| Exact file, route, gap row, or static assertion known | Skip | Skip | Read the smallest repo slice and patch |
| Failing check names the exact dependency, file, row, or assertion | Skip | Skip | Patch the named seam |
| Owner route/service/model unknown | One owner lookup | Skip | Read the located owner and patch |
| Shared exported contract changes | One references lookup | Skip unless prior API decision matters | Patch compatible source/tests |
| Prior accepted decision changes the edit | Use only if code impact is unclear | Read one specific InkRoute note | Decide from repo evidence |
| Review or handoff completed | Use changed exported symbols only if needed | Append one concise note after result | Record decision, review, or handoff |

## Gap closure preset

1. `GAP_TRACKER.md` row.
2. Owning runtime/readiness source.
3. Matrix, command list, or artifact helper.
4. Static assertions.
5. Package mirror if present.
6. Tracker wording.

Default: zero Obsidian calls and at most one Serena lookup.

## Query pack

- Owner: `Find the symbol or file that owns <route/function/gap-runtime-name>. Return only likely owner files and exported symbols.`
- References: `Find direct references to <exported-symbol>. Return call sites/tests that would break if the contract changes.`
- Route trace: `Trace <route-path> from handler to service/database boundary. Return handler, validator, auth/tenant checks, and persistence names.`
- Review: `Inspect changed exported symbols in <files>. Return only correctness/security/API risks and direct call sites.`

## Safety

- Repo code, tests, `GAP_TRACKER.md`, and `spec/*` are authoritative.
- Obsidian is memory, not evidence.
- Never store secrets, provider IDs, raw logs, PII, customer data, or `.env` values here.
- If Serena or Obsidian is unavailable, ambiguous, credential-gated, or noisy after one attempt, fall back to scoped RTK search.
"@
  "Gap-Closure-Dashboard.md" = @"
# InkRoute gap closure dashboard

Use this as a local scratch dashboard only. `GAP_TRACKER.md` remains authoritative.

## Fast lane

| Situation | Action |
| --- | --- |
| Exact gap row and owner file known | Skip Serena and Obsidian; patch the smallest source/test/tracker set. |
| Package has repeated inline command/control identity seams | Batch source helper, static `toBe(...)`, and tracker helper-name updates by package; do not reopen tools between rows. |
| Owner file unknown | Use one Serena owner lookup, then patch from repo evidence. |
| Exported contract changes | Use one Serena references lookup before patching. |
| Prior decision changes the edit | Read one specific InkRoute note, then decide from repo evidence. |
| Durable decision/review/handoff produced | Append one concise note after implementation. |

## Active gap

- Gap:
- Local seam to close:
- Source/test/tracker paths:
- Commands/tests:
- External gates retained:
- Residual risk:

Never paste secrets, provider IDs, raw logs, PII, customer data, or `.env` values here.
"@
}

foreach ($entry in $notes.GetEnumerator()) {
  $path = Join-Path $projectDir $entry.Key
  Write-MarkdownIfNeeded -Path $path -Value $entry.Value
}

$templates = @{
  "Codex Review.md" = @"
## {{date}} Codex Review - <scope>

- Scope: <files/routes/packages reviewed>
- Decision: approved | changes requested | blocked
- Key findings: <concise bullets>
- Tests/commands: <what ran or "not run">
- Residual risk: <remaining risk or "none known">
"@
  "DeepSeek Handoff.md" = @"
## {{date}} DeepSeek Handoff - <task>

- Summary: <what changed>
- Files changed: <paths>
- Tests run: <commands and result>
- Remaining gaps: <gap IDs or none>
- Risks: <security/data/API/runtime risks>
- Codex review checklist: <items Codex must verify>
"@
  "Decision.md" = @"
## DEC-{{date}}-<slug>

- Decision: <accepted choice>
- Context: <problem and constraints>
- Alternatives: <rejected options>
- Consequences: <tradeoffs and follow-up work>
- Repo evidence: <committed docs/tests/files>
"@
  "Gap Closure Note.md" = @"
## {{date}} Gap Closure - <gap-id>

- Gap: <GAP-*>
- Local seam closed: <source/test/tracker paths>
- Tests/commands: <what ran or "not run">
- External gates retained: <provider/legal/credential/CI gates>
- Residual risk: <concise>
"@
  "Current Work.md" = @"
## {{date}} Current Work - <scope>

- Focus:
- Repo evidence paths:
- Commands/tests:
- Decision/handoff to append:
- Residual risk:

Do not paste secrets, provider IDs, raw logs, PII, customer data, or `.env` values.
"@
  "Codex Review Checklist.md" = @"
## {{date}} Codex Review Checklist - <scope>

- Correctness:
- Security/auth/RBAC:
- Tenant isolation:
- Data integrity/transactions:
- API/frontend contract:
- Tests/static assertions:
- Tracker/docs honesty:
- Secrets/provider/prod untouched:
- Decision: approved | changes requested | blocked
"@
  "CI Fix Note.md" = @"
## {{date}} CI Fix - <check>

- Check:
- Exact error seam:
- Files patched:
- Tests/commands:
- Remaining external gate:
- Risk:
"@
}

foreach ($entry in $templates.GetEnumerator()) {
  $path = Join-Path $templateDir $entry.Key
  Write-MarkdownIfNeeded -Path $path -Value $entry.Value
}

if ($WithDailyNote) {
  $dailyPath = Join-Path $dailyDir ("{0}.md" -f (Get-Date -Format "yyyy-MM-dd"))
  if (-not (Test-Path $dailyPath)) {
    Set-Content -Path $dailyPath -Encoding utf8 -Value @"
# $(Get-Date -Format "yyyy-MM-dd") InkRoute working note

- Focus:
- Repo evidence:
- Commands/tests:
- Decisions/handoffs to append:
- Residual risk:

Do not paste secrets, provider IDs, raw logs, PII, or `.env` values.
"@
  }
}

Write-Host "InkRoute Obsidian vault ready: $vaultRoot"
Write-Host "Open note: $indexPath"
Write-Host "Templates: $templateDir"
Write-Host "Daily notes: $dailyDir"
if ($ForceConfig) {
  Write-Host "Config mode: refreshed Obsidian app/workspace/bookmark settings."
} else {
  Write-Host "Config mode: preserved existing Obsidian app/workspace/bookmark settings; use -ForceConfig to refresh them."
}
if ($ForceNotes) {
  Write-Host "Notes mode: refreshed repo-owned InkRoute workflow notes and templates."
} else {
  Write-Host "Notes mode: preserved existing workflow notes/templates; use -ForceNotes to refresh repo-owned routing content."
}
if ($WithDailyNote) {
  Write-Host "Daily mode: ensured today's local scratch note exists under Projects/InkRoute/Daily."
}

if ($OpenNow) {
  Start-Process "obsidian://open?path=$([uri]::EscapeDataString($vaultRoot))"
}


