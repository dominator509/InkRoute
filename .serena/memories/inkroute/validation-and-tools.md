# Validation and tools

- Do not run tests or validation unless the user asks.
- If validation is requested, prefer repo scripts already documented in package.json, docs/ai/*, or spec/PROJECT_STATE.md.
- Do not run provider, deployment, migration, Playwright, live-browser, secret-dependent, mobile-device, or production-infrastructure checks during docs/tooling bootstrap unless explicitly approved.
- RTK is mandatory for repo shell commands; use `rtk proxy powershell -NoProfile -Command "<command>"` for PowerShell builtins and pipelines.
- For Obsidian, use scripts/bootstrap-obsidian-vault.ps1; generated vault state belongs under ignored .obsidian/.
- The bootstrap preserves local Obsidian config by default. Use -ForceConfig only when intentionally refreshing app/workspace/bookmark settings.
- Open `Projects/InkRoute/Command-Center.md` first when manually using the local vault.
- Approved durable Obsidian project notes are under `Projects/InkRoute/`: `Repo-Brief.md`, `Architecture.md`, `API-Contracts.md`, `Codex-Reviews.md`, `DeepSeek-Handoffs.md`, and `Decisions.md`.
- Local scratch/router notes may also live under `Projects/InkRoute/`: `Command-Center.md`, `Current-Work.md`, `Workflow-Routing.md`, `RTK-Command-Recipes.md`, `Vault-Safety.md`, `Serena-Obsidian-Loop.md`, and `Gap-Closure-Dashboard.md`; never treat them as repo evidence.
