import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const helper = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'roadmap.mjs');
const root = mkdtempSync(path.join(os.tmpdir(), 'roadmap-discipline-'));
function run(args, ok = true) {
  const r = spawnSync(process.execPath, [helper, ...args], { cwd: root, encoding: 'utf8' });
  if (ok) assert.equal(r.status, 0, r.stderr || r.stdout);
  else assert.notEqual(r.status, 0, 'expected command to fail');
  return r;
}
function git(args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
}
try {
  git(['init', '-q', '--template=']);
  git(['config', 'user.email', 'self-test@example.invalid']);
  git(['config', 'user.name', 'Roadmap Self Test']);
  const docs = path.join(root, 'docs', 'roadmap-discipline');
  mkdirSync(docs, { recursive: true });
  writeFileSync(path.join(root, 'worker.js'), 'export const worker = true;\n');
  const features = path.join(docs, 'features.md');
  writeFileSync(features, `# Project Feature Roadmap\n\n**Status:** In Progress\n**Current Phase:** Phase 1\n\n## Global Phases\n\n- [ ] Phase 1: Core\n\n## Features\n\n### Phase 1: Core implementation\n\n- [ ] **F1.1** (State: \`active\` | Verification: \`node --check worker.js\`)\n  - *Behavior:* Implement recovery behavior.\n  - *Evidence:* None\n\n## Resume Notes\n\n- **Last completed:** Setup.\n- **Next action:** Edit worker.js to implement recovery.\n- **Known blockers:** None\n`);
  git(['add', '.']);
  git(['commit', '-qm', 'fixture']);
  const legacy = run(['resume', '--root', root]);
  assert.match(legacy.stdout, /Mode: legacy/);
  run(['checkpoint', '--root', root, '--expected-revision', '0', '--in-progress', 'F1.1 selected; implementation pending.', '--next', 'Edit worker.js to implement recovery.', '--why', 'F1.1 is active.', '--reload', 'worker.js']);
  const text = readFileSync(features, 'utf8');
  assert.match(text, /## Recovery State/);
  assert.match(text, /"revision": 1/);
  const resumed = run(['resume', '--root', root]);
  assert.match(resumed.stdout, /Focus feature: F1\.1/);
  assert.match(resumed.stdout, /Edit worker\.js to implement recovery/);
  run(['checkpoint', '--root', root, '--expected-revision', '0'], false);
  writeFileSync(features, readFileSync(features, 'utf8').replace('State: `active`', 'State: `passing`').replace('*Evidence:* None', '*Evidence:* node --check worker.js passed'));
  run(['check', '--root', root], false);
  console.log('roadmap discipline self-test: OK');
} finally {
  rmSync(root, { recursive: true, force: true });
}
