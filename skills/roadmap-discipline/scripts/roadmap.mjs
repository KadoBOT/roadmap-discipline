#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const HEADING = '## Recovery State';
const VALID_STATES = new Set(['not_started', 'active', 'blocked', 'deferred', 'passing']);
const VALID_VERIFY = new Set(['not_run', 'passed', 'failed', 'unknown']);
const VAGUE = new Set(['continue', 'continue implementation', 'finish', 'finish task', 'resume', 'next', 'keep going', 'unknown']);

function parseArgs(argv) {
  const [command = 'help', ...rest] = argv;
  const flags = new Map();
  for (let i = 0; i < rest.length;) {
    const token = rest[i];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const next = rest[i + 1];
    const value = next && !next.startsWith('--') ? next : 'true';
    flags.set(key, [...(flags.get(key) ?? []), value]);
    i += value === 'true' ? 1 : 2;
  }
  return { command, flags };
}
const one = (f, k) => f.get(k)?.at(-1);
const many = (f, k) => f.get(k) ?? [];
const has = (f, k) => f.has(k);

function section(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`^## ${escaped}\\s*$`, 'm').exec(text);
  if (!m) return '';
  const rest = text.slice(m.index + m[0].length);
  const next = /^##\s+/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}
function bold(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.match(new RegExp(`^\\*\\*${escaped}:\\*\\*\\s*(.+)$`, 'mi'))?.[1]?.trim() ?? '';
}
function note(text, name) {
  const body = section(text, 'Resume Notes');
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return body.match(new RegExp(`^\\s*-?\\s*\\*\\*${escaped}:\\*\\*\\s*(.+)$`, 'mi'))?.[1]?.trim() ?? '';
}

function parseFeatures(text) {
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  const result = [];
  let phase = '';
  for (let i = 0; i < lines.length; i++) {
    const p = /^###\s+(.+?)\s*$/.exec(lines[i]);
    if (p) { phase = p[1].trim(); continue; }
    const f = /^\s*-\s*\[([ xX])\]\s*\*\*([^*]+)\*\*\s*(\[parallel:\s*subagents recommended\])?\s*\(State:\s*`([^`]+)`\s*\|\s*Verification:\s*`([^`]*)`\)\s*$/.exec(lines[i]);
    if (!f) continue;
    const item = { checked: f[1].toLowerCase() === 'x', id: f[2].trim(), parallel: Boolean(f[3]), state: f[4].trim(), verification: f[5].trim(), phase, behavior: '', evidence: '' };
    for (let j = i + 1; j < Math.min(lines.length, i + 7); j++) {
      if (/^\s*-\s*\[[ xX]\]/.test(lines[j]) || /^#{2,3}\s+/.test(lines[j])) break;
      const b = /^\s+-\s+\*Behavior:\*\s*(.*)$/.exec(lines[j]);
      const e = /^\s+-\s+\*Evidence:\*\s*(.*)$/.exec(lines[j]);
      if (b) item.behavior = b[1].trim();
      if (e) item.evidence = e[1].trim();
    }
    result.push(item);
  }
  return result;
}

function parseRecovery(text) {
  const h = text.indexOf(HEADING);
  if (h < 0) return { state: null, range: null };
  const after = text.slice(h + HEADING.length);
  const open = /```json\s*\n/i.exec(after);
  if (!open) throw new Error(`${HEADING} must contain a fenced json block.`);
  const start = h + HEADING.length + open.index + open[0].length;
  const close = text.slice(start).indexOf('\n```');
  if (close < 0) throw new Error(`${HEADING} json block is not closed.`);
  const end = start + close;
  let state;
  try { state = JSON.parse(text.slice(start, end).trim()); }
  catch (error) { throw new Error(`${HEADING} contains invalid JSON: ${error.message}`); }
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error(`${HEADING} must contain one JSON object.`);
  return { state, range: { start, end } };
}
function readRoadmap(file) {
  const text = readFileSync(file, 'utf8');
  const recovery = parseRecovery(text);
  return { file, text, status: bold(text, 'Status'), currentPhase: bold(text, 'Current Phase'), features: parseFeatures(text), recovery: recovery.state, recoveryRange: recovery.range };
}

function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
}
function rel(root, value) { return path.relative(root, path.resolve(root, value)).replaceAll('\\', '/'); }
function snapshot(root, ignored = []) {
  const ignore = new Set(ignored.map((x) => rel(root, x)));
  const branch = git(root, ['branch', '--show-current']) || 'Unknown';
  const head = git(root, ['rev-parse', '--short=12', 'HEAD']) || 'Unknown';
  const raw = spawnSync('git', ['status', '--porcelain=v1', '-z'], { cwd: root, encoding: 'utf8' });
  const dirty = raw.status === 0 ? raw.stdout.split('\0').filter(Boolean).map((x) => x.slice(3).trim().replaceAll('\\', '/')).filter((x) => x && !ignore.has(x)).sort() : [];
  const exclusions = [...ignore].map((x) => `:(exclude)${x}`);
  const diff = [git(root, ['diff', '--binary', 'HEAD', '--', '.', ...exclusions]), git(root, ['diff', '--binary', '--cached', 'HEAD', '--', '.', ...exclusions]), dirty.join('\n')].join('\n');
  return { branch, head, dirty, dirty_hash: createHash('sha256').update(diff).digest('hex') };
}

const active = (r) => r.features.filter((f) => f.state === 'active');
function focusCandidate(r) {
  const actives = active(r);
  if (r.recovery?.focus_feature && r.recovery.focus_feature !== 'None') {
    const found = actives.find((f) => f.id === r.recovery.focus_feature);
    if (found) return found;
  }
  if (actives.length === 1) return actives[0];
  return r.features.find((f) => f.phase === r.currentPhase && f.state === 'not_started') ?? null;
}
function defaultState(r, root) {
  const focus = focusCandidate(r);
  const blocker = note(r.text, 'Known blockers');
  return {
    version: 1, revision: 0, phase: r.currentPhase || focus?.phase || 'Unknown', active_features: active(r).map((f) => f.id), focus_feature: focus?.id ?? 'None',
    goal: focus?.behavior || 'Unknown', done_when: focus?.verification ? `Verification succeeds and evidence is recorded: ${focus.verification}` : 'Unknown',
    last_completed: note(r.text, 'Last completed') || 'Unknown', in_progress: 'Unknown — reconcile the current working tree before implementation.',
    next: { action: note(r.text, 'Next action') || 'Unknown', reason: focus ? `${focus.id} is the selected unfinished feature.` : 'No focus feature could be established from disk.' },
    files: [], repository: snapshot(root, [r.file]), verification: { required: focus?.verification ?? '', last_run: '', status: 'unknown', detail: '' },
    blockers: blocker && blocker.toLowerCase() !== 'none' ? [blocker] : [], reload: [rel(root, r.file)]
  };
}
function replaceRecovery(text, range, state) {
  const json = JSON.stringify(state, null, 2);
  if (range) return `${text.slice(0, range.start)}${json}${text.slice(range.end)}`;
  const block = `${HEADING}\n\n\`\`\`json\n${json}\n\`\`\``;
  const resume = /^## Resume Notes\s*$/m.exec(text);
  return resume ? `${text.slice(0, resume.index).trimEnd()}\n\n${block}\n\n${text.slice(resume.index)}` : `${text.trimEnd()}\n\n${block}\n`;
}
function parseFile(value) { const i = value.indexOf('='); if (i < 1) throw new Error(`Invalid --file value: ${value}; use path=state.`); return { path: value.slice(0, i).trim(), state: value.slice(i + 1).trim() }; }
function revision(value) { if (value === undefined) return undefined; const n = Number(value); if (!Number.isInteger(n) || n < 0) throw new Error(`Invalid revision: ${value}`); return n; }

function checkpoint(r, root, flags) {
  const current = r.recovery ?? defaultState(r, root);
  const expected = revision(one(flags, 'expected-revision'));
  if (expected !== undefined && expected !== current.revision) throw new Error(`Revision conflict: expected ${expected}, found ${current.revision}. Rerun resume before writing.`);
  const focusId = one(flags, 'focus-feature') ?? current.focus_feature;
  const focus = focusId === 'None' ? null : r.features.find((f) => f.id === focusId);
  if (focusId !== 'None' && !focus) throw new Error(`Unknown focus feature: ${focusId}`);
  const fileArgs = many(flags, 'file'), blockerArgs = many(flags, 'blocker'), reloadArgs = many(flags, 'reload');
  const verifyStatus = one(flags, 'verification-status') ?? current.verification.status;
  if (!VALID_VERIFY.has(verifyStatus)) throw new Error(`Invalid verification status: ${verifyStatus}`);
  const next = {
    ...current, version: 1, revision: current.revision + 1, phase: one(flags, 'phase') ?? r.currentPhase ?? current.phase,
    active_features: active(r).map((f) => f.id), focus_feature: focusId, goal: one(flags, 'goal') ?? current.goal, done_when: one(flags, 'done-when') ?? current.done_when,
    last_completed: one(flags, 'last-completed') ?? current.last_completed, in_progress: one(flags, 'in-progress') ?? current.in_progress,
    next: { action: one(flags, 'next') ?? current.next.action, reason: one(flags, 'why') ?? current.next.reason },
    files: has(flags, 'clear-files') ? [] : fileArgs.length ? fileArgs.map(parseFile) : current.files, repository: snapshot(root, [r.file]),
    verification: { required: focus?.verification ?? current.verification.required, last_run: one(flags, 'verification-command') ?? current.verification.last_run, status: verifyStatus, detail: one(flags, 'verification-detail') ?? current.verification.detail },
    blockers: has(flags, 'clear-blockers') ? [] : blockerArgs.length ? blockerArgs : current.blockers,
    reload: has(flags, 'clear-reload') ? [] : reloadArgs.length ? reloadArgs : current.reload
  };
  writeFileSync(r.file, replaceRecovery(r.text, r.recoveryRange, next).replace(/\s*$/, '\n'), 'utf8');
  return next;
}

function refExists(root, roadmapFile, ref) {
  const clean = String(ref).split('#')[0].replace(/^`|`$/g, '').trim();
  if (!clean || ['None', 'Unknown'].includes(clean)) return true;
  return existsSync(path.resolve(root, clean)) || existsSync(path.resolve(path.dirname(roadmapFile), clean));
}
function validate(r, root) {
  const issues = [], add = (severity, message) => issues.push({ severity, message });
  for (const f of r.features) {
    if (!VALID_STATES.has(f.state)) add('error', `${f.id} has invalid state: ${f.state}`);
    if (f.checked && !['passing', 'deferred'].includes(f.state)) add('error', `${f.id} is checked but state is ${f.state}.`);
    if (f.state === 'passing' && (!f.evidence || f.evidence.toLowerCase() === 'none')) add('error', `${f.id} is passing but has no evidence.`);
  }
  const actives = active(r);
  if (actives.length > 1 && !actives.every((f) => f.parallel)) add('error', `Multiple active features without parallel markers: ${actives.map((f) => f.id).join(', ')}`);
  if (!r.recovery) { add('warning', 'Legacy feature list: Recovery State is missing. Checkpoint before implementation continues.'); return issues; }
  const s = r.recovery;
  if (s.version !== 1) add('error', `Unsupported Recovery State version: ${s.version}`);
  if (!Number.isInteger(s.revision) || s.revision < 1) add('error', 'Recovery State revision must be a positive integer.');
  if (String(s.phase).trim() !== r.currentPhase.trim()) add('error', `Recovery phase "${s.phase}" disagrees with Current Phase "${r.currentPhase}".`);
  const actual = actives.map((f) => f.id).sort(), recorded = Array.isArray(s.active_features) ? [...s.active_features].sort() : [];
  if (JSON.stringify(actual) !== JSON.stringify(recorded)) add('error', `Recovery active_features [${recorded.join(', ')}] disagree with feature states [${actual.join(', ')}].`);
  const focus = s.focus_feature === 'None' ? null : r.features.find((f) => f.id === s.focus_feature);
  if (s.focus_feature !== 'None') {
    if (!focus) add('error', `Recovery focus_feature does not exist: ${s.focus_feature}`);
    else {
      if (focus.state !== 'active') add('error', `Recovery focus_feature ${focus.id} has state ${focus.state}, expected active.`);
      if (focus.phase !== s.phase) add('error', `${focus.id} belongs to "${focus.phase}" but Recovery State phase is "${s.phase}".`);
      if (s.verification?.required !== focus.verification) add('error', `Recovery verification.required disagrees with ${focus.id}'s verification command.`);
    }
  }
  for (const [name, value] of [['goal', s.goal], ['done_when', s.done_when], ['in_progress', s.in_progress], ['next.action', s.next?.action], ['next.reason', s.next?.reason]]) if (typeof value !== 'string' || !value.trim()) add('error', `Recovery State ${name} is empty.`);
  if (VAGUE.has(String(s.next?.action ?? '').trim().toLowerCase())) add('error', `Recovery next.action is too vague: "${s.next?.action}".`);
  if (!s.verification || !VALID_VERIFY.has(s.verification.status)) add('error', 'Recovery verification.status is invalid or missing.');
  if (s.verification?.status === 'passed' && !String(s.verification.last_run ?? '').trim()) add('error', 'Verification status is passed but verification.last_run is empty.');
  if (!Array.isArray(s.files)) add('error', 'Recovery files must be an array.');
  if (!Array.isArray(s.blockers)) add('error', 'Recovery blockers must be an array.');
  if (!Array.isArray(s.reload)) add('error', 'Recovery reload must be an array.'); else for (const ref of s.reload) if (!refExists(root, r.file, ref)) add('error', `Recovery reload reference does not exist: ${ref}`);
  if (r.status.trim().toLowerCase() === 'complete') {
    const unfinished = r.features.filter((f) => !['passing', 'deferred'].includes(f.state));
    if (unfinished.length) add('error', `Roadmap Status is Complete but unfinished features remain: ${unfinished.map((f) => f.id).join(', ')}`);
    if (s.focus_feature !== 'None' || actual.length) add('error', 'Roadmap Status is Complete but active/focus features remain.');
  }
  return issues;
}

function renderResume(r, root) {
  if (!r.recovery) { const focus = focusCandidate(r); return `ROADMAP RECOVERY\n\nFeature list: ${rel(root, r.file)}\nMode: legacy (Recovery State missing)\nPhase: ${r.currentPhase || 'Unknown'}\nCandidate focus: ${focus?.id ?? 'Unknown'}\n\nCreate a structured checkpoint before implementation continues.`; }
  const s = r.recovery, now = snapshot(root, [r.file]), drift = [];
  if (s.repository?.head && s.repository.head !== 'Unknown' && now.head !== s.repository.head) drift.push(`HEAD changed: ${s.repository.head} -> ${now.head}`);
  if (s.repository?.dirty_hash && now.dirty_hash !== s.repository.dirty_hash) drift.push('Working-tree state differs from the last checkpoint. Reconcile unrecorded changes before trusting partial-state notes.');
  const lines = ['ROADMAP RECOVERY', '', `Feature list: ${rel(root, r.file)}`, `Revision: ${s.revision}`, `Phase: ${s.phase}`, `Active features: ${(s.active_features ?? []).join(', ') || '(none)'}`, `Focus feature: ${s.focus_feature}`, '', 'OBJECTIVE', s.goal, '', 'DONE WHEN', s.done_when, '', 'CURRENT STATE', `Last completed: ${s.last_completed}`, `In progress: ${s.in_progress}`, '', 'VERIFICATION', `Required: ${s.verification?.required || '(none recorded)'}`, `Last run: ${String(s.verification?.status ?? 'unknown').toUpperCase()} — ${s.verification?.last_run || '(none)'}`, s.verification?.detail || '(no detail recorded)', '', 'NEXT', s.next?.action ?? 'Unknown', `Why: ${s.next?.reason ?? 'Unknown'}`];
  if (s.files?.length) { lines.push('', 'FILES / ARTIFACTS'); s.files.forEach((f) => lines.push(`- ${f.path} — ${f.state}`)); }
  if (s.blockers?.length) { lines.push('', 'BLOCKERS / UNKNOWNS'); s.blockers.forEach((b) => lines.push(`- ${b}`)); }
  if (s.reload?.length) { lines.push('', 'RELOAD'); s.reload.forEach((x, i) => lines.push(`${i + 1}. ${x}`)); }
  if (drift.length) { lines.push('', 'STATE DRIFT'); drift.forEach((x) => lines.push(`- WARNING: ${x}`)); }
  return lines.join('\n');
}

function help() { console.log(`Roadmap Discipline recovery helper\n\nUsage:\n  node <skill>/scripts/roadmap.mjs resume [--root <workspace>] [--features <path>]\n  node <skill>/scripts/roadmap.mjs checkpoint [options]\n  node <skill>/scripts/roadmap.mjs check [--strict]\n\nCheckpoint options:\n  --expected-revision <n>\n  --phase <text>\n  --focus-feature <id|None>\n  --goal <text>\n  --done-when <text>\n  --last-completed <text>\n  --in-progress <text>\n  --next <text>\n  --why <text>\n  --file <path=state>          repeatable\n  --clear-files\n  --verification-command <cmd>\n  --verification-status <not_run|passed|failed|unknown>\n  --verification-detail <text>\n  --blocker <text>             repeatable\n  --clear-blockers\n  --reload <path[#anchor]>     repeatable\n  --clear-reload\n\nThe same file runs under Bun.`); }
function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (['help', '--help', '-h'].includes(command)) return help();
  const root = path.resolve(one(flags, 'root') ?? process.cwd());
  const file = path.resolve(root, one(flags, 'features') ?? 'docs/roadmap-discipline/features.md');
  if (!existsSync(file)) throw new Error(`Feature list not found: ${file}`);
  let roadmap = readRoadmap(file);
  if (command === 'checkpoint') {
    const state = checkpoint(roadmap, root, flags); roadmap = readRoadmap(file); const issues = validate(roadmap, root);
    console.log(`Checkpointed ${rel(root, file)} at revision ${state.revision}.`); issues.forEach((i) => console.log(`- ${i.severity.toUpperCase()}: ${i.message}`)); if (issues.some((i) => i.severity === 'error')) process.exitCode = 1; return;
  }
  if (command === 'check') {
    const issues = validate(roadmap, root); issues.forEach((i) => console.log(`${i.severity.toUpperCase()}: ${i.message}`));
    console.log(`Roadmap check: ${issues.filter((i) => i.severity === 'error').length} error(s), ${issues.filter((i) => i.severity === 'warning').length} warning(s).`);
    if (issues.some((i) => i.severity === 'error') || (has(flags, 'strict') && issues.length)) process.exitCode = 1; return;
  }
  if (command === 'resume') {
    const issues = validate(roadmap, root), errors = issues.filter((i) => i.severity === 'error');
    if (errors.length) { errors.forEach((i) => console.error(`ERROR: ${i.message}`)); process.exitCode = 1; return; }
    console.log(renderResume(roadmap, root)); const warnings = issues.filter((i) => i.severity === 'warning');
    if (warnings.length) { console.log('\nVALIDATION WARNINGS'); warnings.forEach((i) => console.log(`- ${i.message}`)); } return;
  }
  throw new Error(`Unknown command: ${command}`);
}
try { main(); } catch (error) { console.error(`roadmap: ${error.message}`); process.exitCode = 1; }
