/**
 * Reads and rewrites the package version everywhere it is written down.
 *
 * The version lives in package.json and in every pinned specifier
 * `@appulsauce/ninja-keys@X.Y.Z` (the esm.sh URLs in the README and on the
 * installation page). Pinned specifiers are found by scanning the files git
 * knows about, so a new one is picked up without editing this script.
 *
 * Every rewrite records where it came from in the git directory, so `undo`
 * puts the previous version back. `set` takes any valid semver, so it also
 * serves to go back further or to a version of your choosing.
 *
 *   node scripts/version.ts show            current version and every mention
 *   node scripts/version.ts check           exit 1 unless all mentions agree
 *   node scripts/version.ts bump <kind>     major | minor | patch | pre<kind>
 *   node scripts/version.ts set <version>   any valid semver, e.g. 2.0.0-rc.1
 *   node scripts/version.ts undo            revert the last bump/set
 *
 * `--dry-run` on bump, set and undo prints the changes without writing.
 * `--preid <id>` names the prerelease for a pre* bump (default `rc`).
 */

import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import semver from 'semver';

const PACKAGE = '@appulsauce/ninja-keys';
const MANIFEST = 'package.json';
/** Text files that may carry a pinned specifier. */
const SCANNED = /\.(?:md|html|svelte|ts|js|mjs|json)$/;
/** Generated or lock files: their versions are not ours to rewrite. */
const SKIPPED = new Set([MANIFEST, 'pnpm-lock.yaml', 'custom-elements.json']);
/** `PACKAGE@<version>`; the capture is checked with semver where it matters. */
const PINNED = /@appulsauce\/ninja-keys@(\d[\w.+-]*)/g;

const BUMPS = [
  'major',
  'minor',
  'patch',
  'premajor',
  'preminor',
  'prepatch',
  'prerelease',
] as const;
type Bump = (typeof BUMPS)[number];
const isBump = (value: string): value is Bump =>
  (BUMPS as readonly string[]).includes(value);

interface Mention {
  readonly file: string;
  readonly line: number;
  readonly version: string;
}

interface HistoryEntry {
  readonly from: string;
  readonly to: string;
  readonly at: string;
}

const git = (...args: readonly string[]): string =>
  // A developer tool run in the developer's own shell: git comes from their
  // PATH like every other command in the Justfile.
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  execFileSync('git', args, {encoding: 'utf8'}).trim();

const root = git('rev-parse', '--show-toplevel');
const historyPath = path.resolve(
  root,
  git('rev-parse', '--git-path', 'ninja-keys-version-history.json')
);
const at = (file: string) => path.join(root, file);

/** An expected failure: reported as one line, without a stack. */
class CliError extends Error {}

function fail(message: string): never {
  throw new CliError(message);
}

function manifestVersion(): string {
  const parsed: unknown = JSON.parse(readFileSync(at(MANIFEST), 'utf8'));
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    typeof parsed.version !== 'string'
  ) {
    fail(`${MANIFEST} has no string "version"`);
  }
  return parsed.version;
}

/** Tracked and untracked-but-not-ignored files that may pin the package. */
function scannedFiles(): string[] {
  return git('ls-files', '--cached', '--others', '--exclude-standard')
    .split('\n')
    .filter(
      (file) =>
        SCANNED.test(file) &&
        !SKIPPED.has(path.basename(file)) &&
        existsSync(at(file))
    );
}

function pinnedMentions(): Mention[] {
  return scannedFiles().flatMap((file) =>
    readFileSync(at(file), 'utf8')
      .split('\n')
      .flatMap((text, index) =>
        [...text.matchAll(PINNED)].map((match) => ({
          file,
          line: index + 1,
          version: match[1] ?? '',
        }))
      )
  );
}

function mentions(): Mention[] {
  const manifestLine =
    readFileSync(at(MANIFEST), 'utf8')
      .split('\n')
      .findIndex((text) => /^\s*"version":/.test(text)) + 1;
  return [
    {file: MANIFEST, line: manifestLine, version: manifestVersion()},
    ...pinnedMentions(),
  ];
}

function disagreeing(current: string): Mention[] {
  return mentions().filter((mention) => mention.version !== current);
}

function show(): void {
  const current = manifestVersion();
  console.log(`version ${current}`);
  for (const {file, line, version} of mentions()) {
    const mark = version === current ? ' ' : '!';
    console.log(`${mark} ${file}:${line}  ${version}`);
  }
  const off = disagreeing(current);
  if (off.length > 0) {
    fail(`${off.length} mention(s) disagree with ${MANIFEST} (marked !)`);
  }
}

function check(): void {
  const current = manifestVersion();
  const off = disagreeing(current);
  for (const {file, line, version} of off) {
    console.error(
      `${file}:${line}: ${PACKAGE}@${version}, expected ${current}`
    );
  }
  if (off.length > 0) {
    fail(`run \`just set-version ${current}\` to bring them in line`);
  }
}

/** Rewrites every mention to `next`; returns the changed file count. */
function rewrite(next: string, dryRun: boolean): number {
  const files = new Map<string, {before: string; after: string}>();

  const manifest = readFileSync(at(MANIFEST), 'utf8');
  const field = `"version": "${manifestVersion()}"`;
  if (!manifest.includes(field)) fail(`${MANIFEST} has no line ${field}`);
  files.set(MANIFEST, {
    before: manifest,
    after: manifest.replace(field, () => `"version": "${next}"`),
  });
  for (const file of new Set(pinnedMentions().map((m) => m.file))) {
    const before = readFileSync(at(file), 'utf8');
    files.set(file, {
      before,
      after: before.replaceAll(PINNED, `${PACKAGE}@${next}`),
    });
  }

  let changed = 0;
  for (const [file, {before, after}] of files) {
    if (before === after) continue;
    changed += 1;
    console.log(`${dryRun ? 'would rewrite' : 'rewrote'} ${file}`);
    if (!dryRun) writeFileSync(at(file), after);
  }
  return changed;
}

function readHistory(): HistoryEntry[] {
  if (!existsSync(historyPath)) return [];
  const parsed: unknown = JSON.parse(readFileSync(historyPath, 'utf8'));
  return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
}

function writeHistory(entries: readonly HistoryEntry[]): void {
  writeFileSync(historyPath, `${JSON.stringify(entries, null, 2)}\n`);
}

function setVersion(requested: string, dryRun: boolean): void {
  const next = semver.valid(requested.replace(/^v/, ''));
  if (!next) fail(`'${requested}' is not a valid semver version`);
  const current = manifestVersion();
  console.log(`${current} -> ${next}${dryRun ? ' (dry run)' : ''}`);
  const changed = rewrite(next, dryRun);
  if (dryRun || changed === 0) return;
  writeHistory([
    ...readHistory(),
    {from: current, to: next, at: new Date().toISOString()},
  ]);
}

function bump(kind: string, preid: string, dryRun: boolean): void {
  if (!isBump(kind)) fail(`bump kind must be one of: ${BUMPS.join(', ')}`);
  const next = semver.inc(manifestVersion(), kind, preid);
  if (!next) fail(`cannot ${kind}-bump ${manifestVersion()}`);
  setVersion(next, dryRun);
}

function undo(dryRun: boolean, force: boolean): void {
  const history = readHistory();
  const last = history.at(-1);
  if (!last) fail('nothing to undo: no rewrite recorded in this clone');
  const current = manifestVersion();
  if (current !== last.to && !force) {
    fail(
      `the last rewrite set ${last.to}, but ${MANIFEST} says ${current}; ` +
        `pass --force to go back to ${last.from} anyway`
    );
  }
  console.log(`${current} -> ${last.from} (undo)${dryRun ? ' (dry run)' : ''}`);
  rewrite(last.from, dryRun);
  if (!dryRun) writeHistory(history.slice(0, -1));
}

function main(): void {
  const {positionals, values} = parseArgs({
    allowPositionals: true,
    options: {
      'dry-run': {type: 'boolean', default: false},
      force: {type: 'boolean', default: false},
      preid: {type: 'string', default: 'rc'},
    },
  });
  const [command = 'show', argument] = positionals;
  const dryRun = values['dry-run'];

  switch (command) {
    case 'show': {
      show();
      break;
    }
    case 'check': {
      check();
      break;
    }
    case 'bump': {
      bump(argument ?? 'patch', values.preid, dryRun);
      break;
    }
    case 'set': {
      if (!argument) fail('set needs a version, e.g. `set 2.0.0`');
      setVersion(argument, dryRun);
      break;
    }
    case 'undo': {
      undo(dryRun, values.force);
      break;
    }
    default: {
      fail(`unknown command '${command}' (show, check, bump, set, undo)`);
    }
  }
}

try {
  main();
} catch (error) {
  if (!(error instanceof CliError)) throw error;
  console.error(`error: ${error.message}`);
  process.exitCode = 1;
}
