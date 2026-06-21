#!/usr/bin/env node

const rawArgs = process.argv.slice(2);
const outputJson = rawArgs.includes("--json");
const outputPacket = rawArgs.includes("--packet");
const outputStrict = rawArgs.includes("--strict");
const outputBrief = rawArgs.includes("--brief");
const outputHot = rawArgs.includes("--hot");
const outputMicro = rawArgs.includes("--micro");
const args = rawArgs.filter((arg) => arg !== "--json" && arg !== "--packet" && arg !== "--strict" && arg !== "--brief" && arg !== "--hot" && arg !== "--micro");
const text = args.join(" ").trim().toLowerCase();

const hasAny = (needles) => needles.some((needle) => text.includes(needle));
const hasRegex = (patterns) => patterns.some((pattern) => pattern.test(text));

const concretePathPatterns = [
  /\b[\w./\\-]+\.(ts|tsx|js|mjs|cjs|json|md|yml|yaml|ps1|sql|css|scss)\b/,
  /\broute\.ts\b/,
  /\bpackage\.json\b/,
  /\bpnpm-lock\.yaml\b/,
  /\bgap_tracker\.md\b/,
  /\bagents\.md\b/,
  /\bclaude\.md\b/,
];

const exactSignals = [
  "gap-",
  "tracker row",
  "tracker row updates",
  "gap tracker",
  "source/test/tracker",
  "assertion",
  "static test",
  "lockfile",
  "dependency",
  "helper",
  "ci log",
  "pr check",
  "pr checks",
  "failing check",
  "failing pr check",
  "failing pr checks",
  "quality workflow",
  "git status",
  "git diff",
  "commit",
];

const workflowToolingSignals = [
  "optimize workflow with serena and obsidian",
  "optimize workflow with serena",
  "optimize workflow with obsidian",
  "optimize serena and obsidian workflow",
  "serena obsidian workflow",
  "serena/obsidian workflow",
  "serena and obsidian workflow",
  "workflow with serena and obsidian",
  "workflow script",
  "workflow routing",
  "optimize workflow",
  "optimize workflow with serena",
  "optimize workflow with obsidian",
  "workflow optimization",
  "optimize serena",
  "optimize obsidian",
  "configure serena",
  "configure obsidian",
  "serena config",
  "obsidian config",
  "tool admission",
  "exact seam",
  "one-shot",
  "one shot",
  "rtk routing",
  "rtk command policy",
  "rtk global",
  "using rtk globally",
  "vault",
  ".serena",
  "project.yml",
  "bootstrap-obsidian",
  "command center",
  "force-config",
  "refresh-all",
  "strict packet",
  "route packet",
  "minimum files",
  "minimumfiles",
];

const workflowToolingPatterns = [
  /\bworkflow\b.*\b(serena|obsidian|rtk|router|routing|tool admission|vault|bootstrap|one-shot)\b/,
  /\b(serena|obsidian|rtk|router|routing|tool admission|vault|bootstrap|one-shot)\b.*\bworkflow\b/,
  /\brtk\b.*\b(routing|router|command policy|global|wrapper|tool admission)\b/,
  /\b(routing|router|command policy|global|wrapper|tool admission)\b.*\brtk\b/,
];

const pairedToolingSignals = [
  "workflow",
  "optimize",
  "optimization",
  "routing",
  "router",
  "tool admission",
  "configure",
  "configuration",
  "setup",
  "vault",
  "bootstrap",
  "one-shot",
];

const namesBothWorkflowTools = text.includes("serena") && text.includes("obsidian");
const namesOneWorkflowTool = text.includes("serena") || text.includes("obsidian");
const isWorkflowToolingRequest =
  hasAny(workflowToolingSignals) ||
  hasRegex(workflowToolingPatterns) ||
  (namesBothWorkflowTools && hasAny(pairedToolingSignals)) ||
  (namesOneWorkflowTool && hasAny(["workflow", "routing", "router", "tool admission", "vault", "bootstrap"]));

const strictPacketRule =
  "Strict packet rule: name minimumFiles, read only that coherent set, patch once, and do not spend conditional Serena or Obsidian budget unless the named condition still exists after the first repo slice.";

const gapBatchSignals = [
  "active goal",
  "current target",
  "current lane",
  "current seam",
  "gap batch",
  "current gap batch",
  "current gap-batch",
  "gap closure",
  "aggressive gap",
  "aggressively close",
  "close gap",
  "close gaps",
  "close the gap",
  "close the gaps",
  "finish gap",
  "finish gaps",
  "finish the gap",
  "finish the gaps",
  "actually close",
  "helper identity",
  "artifact identity",
  "command identity",
  "control identity",
  "runtime static",
  "runtime/static",
  "static contract",
  "required evidence",
  "required commands",
  "required controls",
  "software gap",
  "stop collecting evidence",
  "stop hallucinating",
  "no more evidence",
  "less evidence",
  "close gaps",
  "finish gaps",
  "resume gap",
  "resume gaps",
  "continue gap",
  "continue gaps",
  "continue the gap",
  "continue the gaps",
  "handoff says",
  "summary says",
  "compaction",
  "compacted",
  "compacted summary",
  "context reset",
  "continuation",
  "resume from summary",
  "continue from summary",
  "continue from handoff",
  "releaseautomatedcoverage",
];

const ownerSignals = [
  "owner unknown",
  "find owner",
  "which file",
  "where is",
  "owns",
  "trace route",
  "route boundary",
  "service boundary",
];

const referenceSignals = [
  "references",
  "call sites",
  "call-sites",
  "shared export",
  "exported contract",
  "breaking callers",
  "blast radius",
];

const obsidianSignals = [
  "prior decision",
  "accepted decision",
  "architecture decision",
  "api decision",
  "decision changes",
  "prior history",
];

const obsidianAppendSignals = [
  "append obsidian",
  "append to obsidian",
  "write obsidian",
  "write to obsidian",
  "record in obsidian",
  "update obsidian note",
  "append note",
  "append one concise note",
  "record decision",
  "codex review",
  "review outcome",
  "deepseek handoff",
  "durable handoff",
  "handoff summary",
];

const validationSignals = [
  "validate",
  "validation",
  "run tests",
  "test it",
  "quality",
  "typecheck",
  "build",
];

let route;
let reason;
let nextAction;
let toolBudget;
let evidenceBudget;
let doneShape;
let entrypoints;

if (!text) {
  route = "RTK exact-slice first; Serena and Obsidian are opt-in.";
  reason = "No task text was provided, so default to repo evidence and the admission checklist.";
  nextAction = "If an exact file, row, helper, route, or assertion is known, skip both tools.";
  toolBudget = "Serena: 0 unless owner/references are unknown. Obsidian: 0 unless a prior accepted decision changes the edit.";
  evidenceBudget = "Read budget: one exact slice before patching; no broad exploration.";
  doneShape = "Done: smallest source/test/tracker/docs seam patched or a single precise fallback named.";
  entrypoints = [
    "docs/ai/SERENA_OBSIDIAN_WORKFLOW.md",
    ".serena/memories/inkroute/quickstart.md",
    "Projects/InkRoute/Command-Center.md",
  ];
} else if (isWorkflowToolingRequest) {
  route = "Treat this as workflow/tooling. Patch the known workflow surfaces; do not call Serena or Obsidian as ceremony.";
  reason = "Serena/Obsidian workflow changes are owned by repo docs, .serena config/cards, the router script, and the local vault bootstrap.";
  nextAction = "Use RTK on docs/ai/SERENA_OBSIDIAN_WORKFLOW.md, .serena/project.yml, .serena/memories/inkroute/*, scripts/workflow/route-serena-obsidian.mjs, and scripts/bootstrap-obsidian-vault.ps1 as needed. Prefer the router first, mirror the rule into the canonical doc/cards, and refresh vault notes only when repo-owned note text must mirror the new contract.";
  toolBudget = "Serena: 0. Obsidian: 0 live reads; use the bootstrap script for repo-owned note templates.";
  evidenceBudget = "Read budget: workflow router/doc/config/bootstrap surfaces only; do not inspect source packages.";
  doneShape = "Done: router, canonical doc, Serena card, vault template, and package shortcut aligned only where needed; validation not run unless requested.";
  entrypoints = [
    "scripts/workflow/route-serena-obsidian.mjs",
    "docs/ai/SERENA_OBSIDIAN_WORKFLOW.md",
    ".serena/project.yml",
    ".serena/memories/inkroute/workflow-optimizer.md",
    "scripts/bootstrap-obsidian-vault.ps1",
    "Projects/InkRoute/Workflow-Optimizer.md",
  ];
} else if (hasAny(exactSignals) || hasRegex(concretePathPatterns)) {
  route = "Skip Serena. Skip Obsidian. Use RTK on the exact repo slice.";
  reason = "The task already names a concrete seam.";
  nextAction = "Read the smallest source/test/tracker/docs slice, patch once, and report validation as not run unless explicitly requested.";
  toolBudget = "Serena: 0. Obsidian: 0.";
  evidenceBudget = "Read budget: exact named files only; no owner lookup, no memory lookup, no broad repo summary.";
  doneShape = "Done: named seam patched and any paired source/test/tracker row kept honest.";
  entrypoints = [
    ".serena/memories/inkroute/exact-seam-protocol.md",
    "Projects/InkRoute/Exact-Seam-Protocol.md",
  ];
} else if (hasAny(gapBatchSignals)) {
  route = "Use the current gap-batch accelerator. Skip Obsidian and use Serena only if an owner or exported-reference blast radius is unknown.";
  reason = "Repeated or resumed source/test/tracker helper-identity work is already a known local closure loop.";
  nextAction = "If a handoff or summary names the current runtime/test/tracker seam, treat it as the task brief, read only the exact row plus smallest source/test slices, patch helper identity, and update only the matching tracker row.";
  toolBudget = "Serena: 0 by default, 1 owner/reference lookup only if the owner or callers are unknown. Obsidian: 0.";
  evidenceBudget = "Read budget: one tracker row, one source slice, one test slice; finish the package loop before switching context.";
  doneShape = "Done: helper/contract exported, static assertion tightened, tracker row names the exact helper, external gates preserved.";
  entrypoints = [
    ".serena/memories/inkroute/continuation-handoff.md",
    ".serena/memories/inkroute/current-gap-batch.md",
    ".serena/memories/inkroute/gap-closure-fast-path.md",
    "Projects/InkRoute/Continuation-Handoff.md",
    "Projects/InkRoute/Current-Gap-Batch.md",
    "Projects/InkRoute/Gap-Closure-Dashboard.md",
  ];
} else if (hasAny(referenceSignals)) {
  route = "Use one Serena references lookup. Skip Obsidian unless a prior API decision changes the edit.";
  reason = "A shared/exported contract may affect direct callers.";
  nextAction = "Ask Serena for direct references only, then patch source/tests/direct call sites from repo evidence.";
  toolBudget = "Serena: 1 references lookup, plus 1 follow-up only if ambiguous. Obsidian: 0 unless a named prior decision matters.";
  evidenceBudget = "Read budget: Serena reference list plus direct call-site slices only.";
  doneShape = "Done: exported contract and direct call sites/tests remain compatible.";
  entrypoints = [
    ".serena/memories/inkroute/routing-contract.md",
    ".serena/memories/inkroute/tool-admission.md",
  ];
} else if (hasAny(ownerSignals)) {
  route = "Use one Serena owner lookup. Skip Obsidian.";
  reason = "The owner or route boundary is not yet known.";
  nextAction = "Ask Serena for likely owner files/exported symbols only, then use RTK to read the located slice.";
  toolBudget = "Serena: 1 owner lookup, plus 1 follow-up only if ambiguous. Obsidian: 0.";
  evidenceBudget = "Read budget: one owner answer plus the located file slice; if ambiguous after one follow-up, switch to scoped RTK search.";
  doneShape = "Done: owner identified and the smallest repo seam patched or reported.";
  entrypoints = [
    ".serena/memories/inkroute/routing-contract.md",
    ".serena/memories/inkroute/quickstart.md",
  ];
} else if (hasAny(obsidianSignals)) {
  route = "Read one targeted InkRoute Obsidian note only if a prior accepted decision changes the implementation or review.";
  reason = "The task depends on durable project memory that may alter the next edit or review decision.";
  nextAction = "Read one named project note, then use repo evidence as authoritative before editing or reviewing.";
  toolBudget = "Serena: 0 unless exported references are unclear. Obsidian: 1 targeted project note read.";
  evidenceBudget = "Read budget: one named project note, then current repo evidence; do not browse the vault.";
  doneShape = "Done: prior decision applied or rejected against repo evidence; no note appended unless a durable result is produced.";
  entrypoints = [
    "Projects/InkRoute/Command-Center.md",
    "Projects/InkRoute/Decisions.md",
    "Projects/InkRoute/API-Contracts.md",
    "Projects/InkRoute/Architecture.md",
  ];
} else if (hasAny(obsidianAppendSignals)) {
  route = "Append one concise InkRoute Obsidian note only after the durable result is known.";
  reason = "The task is about retaining a decision, reviewed handoff, or Codex review outcome, not discovering current repo state.";
  nextAction = "Use repo evidence first, then append one concise project note with paths, result, tests or not-run status, and residual risk.";
  toolBudget = "Serena: 0 unless exported references are unclear. Obsidian: 1 append after result; 0 reads unless a prior decision changes the edit.";
  evidenceBudget = "Read budget: current repo evidence only; no vault browsing before the result.";
  doneShape = "Done: durable decision/review/handoff appended once, without raw logs, diffs, secrets, or current-state claims.";
  entrypoints = [
    "Projects/InkRoute/Decisions.md",
    "Projects/InkRoute/Codex-Reviews.md",
    "Projects/InkRoute/DeepSeek-Handoffs.md",
  ];
} else if (hasAny(validationSignals)) {
  route = "Use RTK for the requested command. Serena and Obsidian are not validation tools.";
  reason = "Validation state belongs to command output, not memory or semantic navigation.";
  nextAction = "Run only the explicitly requested non-provider-safe command, or ask before running broad/provider-sensitive checks.";
  toolBudget = "Serena: 0. Obsidian: 0.";
  evidenceBudget = "Read budget: command output only, preferably targeted tails; no semantic or memory lookup.";
  doneShape = "Done: requested command result summarized with exact remaining failing seam if any.";
  entrypoints = [
    ".serena/memories/inkroute/validation-and-tools.md",
    "Projects/InkRoute/CI-Fix-Intake.md",
  ];
} else {
  route = "RTK exact-slice first. Admit Serena only if owner/references are unknown; admit Obsidian only if a prior decision changes the edit.";
  reason = "No signal justifies a tool lookup yet.";
  nextAction = "Classify the task with docs/ai/SERENA_OBSIDIAN_WORKFLOW.md, then move to the smallest repo evidence slice.";
  toolBudget = "Serena: 0 by default, 1 if owner/references are unknown. Obsidian: 0 by default, 1 if a prior accepted decision changes the edit.";
  evidenceBudget = "Read budget: one scoped search or one exact file slice before patching.";
  doneShape = "Done: concrete next file selected and patched, or one precise question/blocker returned.";
  entrypoints = [
    "docs/ai/SERENA_OBSIDIAN_WORKFLOW.md",
    ".serena/memories/inkroute/tool-admission.md",
    "Projects/InkRoute/Tool-Admission.md",
  ];
}

const stopRule =
  "If Serena or Obsidian is unavailable, credential-gated, noisy, or ambiguous after one follow-up, stop lookup and use scoped RTK search.";

const classifyRoute = () => {
  if (isWorkflowToolingRequest) {
    return "workflow-tooling";
  }
  if (hasAny(exactSignals) || hasRegex(concretePathPatterns)) {
    return "exact-seam";
  }
  if (hasAny(gapBatchSignals)) {
    return "gap-batch";
  }
  if (hasAny(referenceSignals)) {
    return "shared-contract";
  }
  if (hasAny(ownerSignals)) {
    return "owner-unknown";
  }
  if (hasAny(obsidianSignals)) {
    return "obsidian-decision";
  }
  if (hasAny(obsidianAppendSignals)) {
    return "obsidian-append";
  }
  if (hasAny(validationSignals)) {
    return "validation";
  }
  return "rtk-first";
};

const budgetForClassification = (classification) => {
  const zero = {
    serenaLookups: 0,
    obsidianNotes: 0,
    obsidianReads: 0,
    obsidianWrites: 0,
    conditionalSerenaLookups: 0,
    conditionalObsidianReads: 0,
    conditionalObsidianWrites: 0,
  };

  switch (classification) {
    case "owner-unknown":
      return {
        ...zero,
        serenaLookups: 1,
      };
    case "shared-contract":
      return {
        ...zero,
        serenaLookups: 1,
        conditionalObsidianReads: 1,
      };
    case "obsidian-decision":
      return {
        ...zero,
        obsidianNotes: 1,
        obsidianReads: 1,
        conditionalSerenaLookups: 1,
      };
    case "obsidian-append":
      return {
        ...zero,
        obsidianNotes: 1,
        obsidianWrites: 1,
        conditionalSerenaLookups: 1,
        conditionalObsidianReads: 1,
      };
    case "gap-batch":
      return {
        ...zero,
        conditionalSerenaLookups: 1,
      };
    case "rtk-first":
      return {
        ...zero,
        conditionalSerenaLookups: 1,
        conditionalObsidianReads: 1,
      };
    default:
      return zero;
  }
};

const commandHints = {
  admit: 'rtk pnpm workflow:admit -- "<task text>"',
  intake: 'rtk pnpm workflow:intake -- "<task text>"',
  routeText: 'rtk pnpm workflow:route -- "<task text>"',
  routeBrief: 'rtk pnpm workflow:route:brief -- "<task text>"',
  routeHot: 'rtk pnpm workflow:route:hot -- "<task text>"',
  hotstart: 'rtk pnpm workflow:hotstart -- "<task text>"',
  codex: 'rtk pnpm workflow:codex -- "<task text>"',
  routeMicro: 'rtk pnpm workflow:route:micro -- "<task text>"',
  micro: 'rtk pnpm workflow:micro -- "<task text>"',
  stoplight: 'rtk pnpm workflow:stoplight -- "<task text>"',
  routePacket: 'rtk pnpm workflow:route:packet -- "<task text>"',
  routeStrict: 'rtk pnpm workflow:route:strict -- "<task text>"',
  routeJson: 'rtk pnpm workflow:route:json -- "<task text>"',
  obsidianBootstrap: "rtk pnpm workflow:obsidian",
  obsidianDaily: "rtk pnpm workflow:obsidian:daily",
  obsidianDailyOpen: "rtk pnpm workflow:obsidian:daily:open",
  obsidianRefresh: "rtk pnpm workflow:obsidian:refresh",
  obsidianForceConfig: "rtk pnpm workflow:obsidian:force-config",
  obsidianRefreshAll: "rtk pnpm workflow:obsidian:refresh-all",
};

const classification = classifyRoute();
const budgetDetail = {
  ...budgetForClassification(classification),
  liveToolCeiling: toolBudget,
};
const minimumFileSetByClassification = {
  "workflow-tooling": [
    "scripts/workflow/route-serena-obsidian.mjs",
    "docs/ai/SERENA_OBSIDIAN_WORKFLOW.md",
    ".serena/project.yml or .serena/memories/inkroute/* only when the rule must be mirrored",
    "scripts/bootstrap-obsidian-vault.ps1 only when repo-owned vault templates must be mirrored",
  ],
  "exact-seam": [
    "the named source/docs/package file",
    "the named test/static assertion file only if behavior or assertions change",
    "the exact GAP_TRACKER.md row only if tracker wording changes",
  ],
  "gap-batch": [
    "one exact GAP_TRACKER.md row",
    "one owning source slice",
    "one static-test slice",
    "one package mirror only if the seam already requires it",
  ],
  "shared-contract": [
    "one Serena references answer",
    "the changed exported contract file",
    "direct call-site/test slices returned by the lookup",
  ],
  "owner-unknown": [
    "one Serena owner answer",
    "the located owner file slice",
  ],
  "obsidian-decision": [
    "one named Projects/InkRoute note",
    "the current repo slice affected by that decision",
  ],
  "obsidian-append": [
    "current repo evidence paths only",
    "one target Projects/InkRoute note for the durable append",
  ],
  validation: [
    "the explicitly requested command output",
    "the smallest failing file slice only if the command names one",
  ],
  "rtk-first": [
    "one scoped RTK search or one exact file slice",
  ],
};
const minimumFileSet = minimumFileSetByClassification[classification] ?? minimumFileSetByClassification["rtk-first"];
const routePacket = {
  classification,
  firstEntrypoint: entrypoints[0],
  liveToolBudget: budgetDetail,
  minimumFileSet,
  next: nextAction,
  evidence: evidenceBudget,
  done: doneShape,
  strictRule: strictPacketRule,
  stopRule,
};

if (outputJson) {
  console.log(
    JSON.stringify(
      {
        classification,
        route,
        reason,
        next: nextAction,
        budget: budgetDetail,
        routePacket,
        entrypoints,
        minimumFileSet,
        commands: commandHints,
        evidence: evidenceBudget,
        done: doneShape,
        strictRule: strictPacketRule,
      stopRule,
    },
      null,
      2,
    ),
  );
} else if (outputMicro) {
  console.log(`classification: ${classification}`);
  console.log(`tools: serena=${routePacket.liveToolBudget.serenaLookups}, obsidianReads=${routePacket.liveToolBudget.obsidianReads}, obsidianWrites=${routePacket.liveToolBudget.obsidianWrites}`);
  console.log(`minimumFiles: ${routePacket.minimumFileSet.join("; ")}`);
  console.log(`next: ${routePacket.next}`);
  console.log(`done: ${routePacket.done}`);
} else if (outputBrief || outputHot) {
  console.log(`classification: ${classification}`);
  console.log(`start: ${routePacket.firstEntrypoint}`);
  console.log(`tools: serena=${routePacket.liveToolBudget.serenaLookups}, obsidianReads=${routePacket.liveToolBudget.obsidianReads}, obsidianWrites=${routePacket.liveToolBudget.obsidianWrites}`);
  if (outputHot) {
    console.log(`conditionalTools: serena=${routePacket.liveToolBudget.conditionalSerenaLookups}, obsidianReads=${routePacket.liveToolBudget.conditionalObsidianReads}, obsidianWrites=${routePacket.liveToolBudget.conditionalObsidianWrites}`);
  }
  console.log(`minimumFiles: ${routePacket.minimumFileSet.join("; ")}`);
  console.log(`next: ${routePacket.next}`);
  console.log(`done: ${routePacket.done}`);
  if (outputHot) {
    console.log(`stopRule: ${routePacket.stopRule}`);
  }
} else if (outputPacket) {
  console.log(`classification: ${classification}`);
  console.log(`start: ${routePacket.firstEntrypoint}`);
  console.log(`serenaLookups: ${routePacket.liveToolBudget.serenaLookups}`);
  console.log(`obsidianReads: ${routePacket.liveToolBudget.obsidianReads}`);
  console.log(`obsidianWrites: ${routePacket.liveToolBudget.obsidianWrites}`);
  if (outputStrict) {
    console.log(`conditionalSerenaLookups: ${routePacket.liveToolBudget.conditionalSerenaLookups}`);
    console.log(`conditionalObsidianReads: ${routePacket.liveToolBudget.conditionalObsidianReads}`);
    console.log(`conditionalObsidianWrites: ${routePacket.liveToolBudget.conditionalObsidianWrites}`);
  }
  console.log(`minimumFiles: ${routePacket.minimumFileSet.join("; ")}`);
  console.log(`next: ${routePacket.next}`);
  console.log(`evidence: ${routePacket.evidence}`);
  console.log(`done: ${routePacket.done}`);
  if (outputStrict) {
    console.log(`strictRule: ${routePacket.strictRule}`);
  }
  console.log(`stopRule: ${routePacket.stopRule}`);
} else {
  console.log("InkRoute Serena/Obsidian route");
  console.log("");
  console.log(`Route: ${route}`);
  console.log(`Reason: ${reason}`);
  console.log(`Next: ${nextAction}`);
  console.log(`Budget: ${toolBudget}`);
  console.log(`Start: ${entrypoints[0]}`);
  console.log(`Entrypoints: ${entrypoints.join("; ")}`);
  console.log(`Minimum files: ${minimumFileSet.join("; ")}`);
  console.log(`Evidence: ${evidenceBudget}`);
  console.log(`Done: ${doneShape}`);
  if (outputStrict) {
    console.log(`Strict: ${strictPacketRule}`);
  }
  console.log("");
  console.log(`Stop rule: ${stopRule}`);
}
