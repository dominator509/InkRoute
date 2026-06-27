import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = execSync('git rev-parse --show-toplevel', {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
}).trim();

const templatePath = resolve(root, '.gitmessage').replace(/\\/g, '/');
const editorWrapperPath = resolve(root, 'scripts/workflow/commit-message-fallback.cmd').replace(/\\/g, '/');

const wrapperScript = `@echo off
setlocal
set "NODE_CMD=node"

where "%NODE_CMD%" >nul 2>&1
if errorlevel 1 (
  echo [commit-message-fallback] node not found in PATH. Attempting common install locations. 1>&2
  if exist "%ProgramFiles%\\nodejs\\node.exe" (
    set "NODE_CMD=%ProgramFiles%\\nodejs\\node.exe"
  ) else if exist "%ProgramFiles(x86)%\\nodejs\\node.exe" (
    set "NODE_CMD=%ProgramFiles(x86)%\\nodejs\\node.exe"
  ) else (
    echo [commit-message-fallback] ERROR: node executable not found. 1>&2
    exit /b 1
  )
) else (
  set "NODE_CMD=node"
)

"%NODE_CMD%" "%~dp0commit-message-fallback.mjs" %*
`;

writeFileSync(editorWrapperPath, wrapperScript, 'utf8');

execSync(`git config commit.template ${templatePath}`, {
  stdio: 'inherit',
});

execSync(`git config core.editor "${editorWrapperPath}"`, {
  stdio: 'inherit',
});

console.log('Commit message fallback configured:');
console.log(`  commit.template = ${templatePath}`);
console.log(`  core.editor = ${editorWrapperPath}`);
