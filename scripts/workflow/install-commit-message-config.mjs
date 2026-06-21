import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = execSync('git rev-parse --show-toplevel', {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
}).trim();

const templatePath = resolve(root, '.gitmessage').replace(/\\/g, '/');
const editorScriptPath = resolve(root, 'scripts/workflow/commit-message-fallback.mjs').replace(/\\/g, '/');

execSync(`git config commit.template ${templatePath}`, {
  stdio: 'inherit',
});

execSync(`git config core.editor "node ${editorScriptPath}"`, {
  stdio: 'inherit',
});

console.log('Commit message fallback configured:');
console.log(`  commit.template = ${templatePath}`);
console.log(`  core.editor = node ${editorScriptPath}`);
