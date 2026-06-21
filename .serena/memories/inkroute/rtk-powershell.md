# InkRoute RTK and PowerShell card

Use this when forming repo shell commands from Codex, Serena notes, or Obsidian notes.

## Default shape

```powershell
rtk proxy powershell -NoProfile -Command "<scoped command>"
```

Use this for PowerShell builtins, pipelines, variables, and commands that need exact shell behavior.

## Escape rule

When a command is launched from Codex or an outer PowerShell string, escape `$` as backtick-dollar so variables survive into the proxied shell.

Correct:

```powershell
rtk proxy powershell -NoProfile -Command "`$line=(Select-String -LiteralPath 'GAP_TRACKER.md' -Pattern '^\| GAP-010 ' | Select-Object -First 1).Line; `$cells=`$line -split '\|'; 0..([Math]::Min(`$cells.Count-1,12)) | ForEach-Object { '[' + `$_ + '] ' + `$cells[`$_].Trim() }"
```

Risky from Codex or outer PowerShell:

```powershell
rtk proxy powershell -NoProfile -Command "$line=(Select-String -LiteralPath 'GAP_TRACKER.md' -Pattern '^\| GAP-010 ' | Select-Object -First 1).Line"
```

The risky form can be expanded by the outer shell before RTK starts the inner PowerShell.

## Direct RTK subcommands

Use direct RTK subcommands only when quoting is simple:

```powershell
rtk git status --short
rtk pnpm --filter @inkroute/booking test
```

Do not add RTK requirements to checked-in package scripts, CI workflows, provider commands, or production automation unless explicitly approved.
