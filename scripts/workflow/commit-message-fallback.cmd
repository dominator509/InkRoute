@echo off
setlocal
set "NODE_CMD=node"

where "%NODE_CMD%" >nul 2>&1
if errorlevel 1 (
  echo [commit-message-fallback] node not found in PATH. Attempting common install locations. 1>&2
  if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
  ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramFiles(x86)%\nodejs\node.exe"
  ) else (
    echo [commit-message-fallback] ERROR: node executable not found. 1>&2
    exit /b 1
  )
) else (
  set "NODE_CMD=node"
)

"%NODE_CMD%" "%~dp0commit-message-fallback.mjs" %*
