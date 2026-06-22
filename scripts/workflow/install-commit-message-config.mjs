import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = execSync('git rev-parse --show-toplevel', {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
}).trim();

const templatePath = resolve(root, '.gitmessage').replace(/\\/g, '/');
const editorScriptPath = resolve(root, 'scripts/workflow/commit-message-fallback.mjs').replace(/\\/g, '/');
const fallbackEditor = process.execPath.replace(/\\/g, '/');
const editorWrapperPath = resolve(root, 'scripts/workflow/commit-message-fallback.cmd').replace(/\\/g, '/');

const wrapperScript = `@echo off
"${fallbackEditor}" "${editorScriptPath}" %*
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
console.log(`  core.editor = ${fallbackEditor} ${editorScriptPath}`);
