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
  // Move feature entries into linked phase ledgers while retaining the checkpoint.
  const splitRoot = mkdtempSync(path.join(os.tmpdir(), 'roadmap-split-'));
  try {
    const splitDocs = path.join(splitRoot, 'docs', 'roadmap-discipline');
    mkdirSync(path.join(splitDocs, 'phases'), { recursive: true });
    writeFileSync(path.join(splitRoot, 'worker.js'), '');
    const index = path.join(splitDocs, 'features.md');
    const ledger = path.join(splitDocs, 'phases', 'one.md');
    const original = readFileSync(features, 'utf8').replace('State: `passing`', 'State: `active`');
    const start = original.indexOf('### Phase 1:');
    const end = original.indexOf('## Recovery State');
    writeFileSync(ledger, original.slice(start, end));
    writeFileSync(index, original.slice(0, start) + '## Phase Ledgers\n\n- [Phase 1](phases/one.md)\n\n' + original.slice(end));
    assert.match(run(['resume', '--root', splitRoot]).stdout, /Focus feature: F1\.1/);
    assert.match(run(['resume', '--root', splitRoot]).stdout, /Focus ledger: docs\/roadmap-discipline\/phases\/one\.md/);
    run(['check', '--root', splitRoot]);
    writeFileSync(ledger, readFileSync(ledger, 'utf8').replace('*Evidence:*', '*Notes:* a\n  - *Notes:* b\n  - *Notes:* c\n  - *Notes:* d\n  - *Notes:* e\n  - *Notes:* f\n  - *Notes:* g\n  - *Evidence:*'));
    run(['checkpoint', '--root', splitRoot, '--next', 'run the F1.1 verification']);
    assert.match(readFileSync(index, 'utf8'), /phases\/one\.md/);
    const before = readFileSync(index, 'utf8');
    run(['checkpoint', '--root', splitRoot, '--next', 'continue'], false);
    assert.equal(readFileSync(index, 'utf8'), before);
    writeFileSync(ledger, readFileSync(ledger, 'utf8') + readFileSync(ledger, 'utf8'));
    assert.match(run(['check', '--root', splitRoot], false).stdout, /Duplicate feature ID/);
    rmSync(ledger);
    assert.match(run(['check', '--root', splitRoot], false).stderr, /Phase ledger not found/);
    writeFileSync(index, readFileSync(index, 'utf8').replace('- [Phase 1](phases/one.md)', 'Note: ledgers below.\n\n- [Phase 1](../outside.md)'));
    assert.match(run(['check', '--root', splitRoot], false).stderr, /escapes the roadmap directory/);
  } finally { rmSync(splitRoot, { recursive: true, force: true }); }
  console.log('roadmap discipline self-test: OK');
} finally {
  rmSync(root, { recursive: true, force: true });
}
