/**
 * Patch 7B: dev-key-custody fail-closed tests.
 *
 * Covers the hardening rules for the dev-only Ed25519 file custody:
 * - key directory is 0700
 * - private key files are 0600
 * - a key directory inside tracked git content (not ignored) is refused
 * - a git-ignored key directory inside a worktree is allowed
 * - metadata can never carry private key material (refused before any write)
 * - round-trip load returns exactly what was saved
 *
 * All tests use throwaway temp dirs via PING_DEV_KEY_DIR; nothing touches
 * the operator's real ~/.ping-dev-keys.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import {
  getDevKeyDir,
  assertDevKeyDirOutsideTrackedGit,
  ensureDevKeyDir,
  devKeyPaths,
  saveDevKeypair,
  loadDevKeypair,
  devKeyExists,
} from './dev-key-custody';

const FAKE_KEYPAIR = {
  public_key: 'aa'.repeat(32),
  private_key: 'bb'.repeat(32),
};

let tmpRoots: string[] = [];
const OLD_ENV = process.env.PING_DEV_KEY_DIR;

function makeTempDir(prefix: string): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

function useKeyDir(dir: string): void {
  process.env.PING_DEV_KEY_DIR = dir;
}

beforeEach(() => {
  delete process.env.PING_DEV_KEY_DIR;
});

afterEach(() => {
  if (OLD_ENV === undefined) delete process.env.PING_DEV_KEY_DIR;
  else process.env.PING_DEV_KEY_DIR = OLD_ENV;
  for (const d of tmpRoots) {
    fs.rmSync(d, { recursive: true, force: true });
  }
  tmpRoots = [];
});

function modeOf(p: string): number {
  return fs.statSync(p).mode & 0o777;
}

describe('dev-key-custody', () => {
  test('getDevKeyDir prefers PING_DEV_KEY_DIR', () => {
    useKeyDir('/tmp/fake-7b-keys');
    expect(getDevKeyDir()).toBe(path.resolve('/tmp/fake-7b-keys'));
  });

  test('ensureDevKeyDir creates the directory with mode 0700', () => {
    const dir = path.join(makeTempDir('7b-custody-'), 'keys');
    useKeyDir(dir);
    const created = ensureDevKeyDir();
    expect(created).toBe(path.resolve(dir));
    expect(modeOf(created)).toBe(0o700);
  });

  test('saveDevKeypair writes the private key file with mode 0600', () => {
    useKeyDir(makeTempDir('7b-custody-'));
    const p = saveDevKeypair('testuser', FAKE_KEYPAIR, { note: '7b test' });
    expect(modeOf(p.privateKey)).toBe(0o600);
    expect(fs.readFileSync(p.privateKey, 'utf8').trim()).toBe(FAKE_KEYPAIR.private_key);
  });

  test('loadDevKeypair round-trips exactly what was saved', () => {
    useKeyDir(makeTempDir('7b-custody-'));
    saveDevKeypair('roundtrip', FAKE_KEYPAIR);
    expect(devKeyExists('roundtrip')).toBe(true);
    expect(loadDevKeypair('roundtrip')).toEqual(FAKE_KEYPAIR);
  });

  test('metadata write is refused when metadata contains private_key (and no metadata file is left)', () => {
    useKeyDir(makeTempDir('7b-custody-'));
    const dir = getDevKeyDir();
    expect(() =>
      saveDevKeypair('badmeta', FAKE_KEYPAIR, { private_key: 'should-never-persist' } as any)
    ).toThrow(/FAIL-CLOSED/);
    const metaPath = path.join(dir, 'badmeta.json');
    expect(fs.existsSync(metaPath)).toBe(false);
  });

  test('metadata file never contains private key material on the happy path', () => {
    useKeyDir(makeTempDir('7b-custody-'));
    const p = saveDevKeypair('cleanmeta', FAKE_KEYPAIR, { purpose: '7b' });
    const raw = fs.readFileSync(p.metadata, 'utf8');
    expect(raw).not.toContain(FAKE_KEYPAIR.private_key);
    expect(JSON.parse(raw)).not.toHaveProperty('private_key');
  });

  test('key directory inside tracked git content (not ignored) is refused', () => {
    const repo = makeTempDir('7b-git-');
    execFileSync('git', ['init', '-q'], { cwd: repo });
    execFileSync('git', ['config', 'user.email', 'test@7b.local'], { cwd: repo });
    execFileSync('git', ['config', 'user.name', '7b'], { cwd: repo });
    const keys = path.join(repo, 'keys-not-ignored');
    expect(() => assertDevKeyDirOutsideTrackedGit(keys)).toThrow(/tracked git/i);
  });

  test('git-ignored key directory inside a worktree is allowed', () => {
    const repo = makeTempDir('7b-git-');
    execFileSync('git', ['init', '-q'], { cwd: repo });
    fs.writeFileSync(path.join(repo, '.gitignore'), 'ignored-keys/\n');
    const keys = path.join(repo, 'ignored-keys');
    expect(() => assertDevKeyDirOutsideTrackedGit(keys)).not.toThrow();
    useKeyDir(keys);
    expect(modeOf(ensureDevKeyDir())).toBe(0o700);
  });

  test('key directory outside any git worktree is allowed', () => {
    const outside = path.join(makeTempDir('7b-nogit-'), 'keys');
    expect(() => assertDevKeyDirOutsideTrackedGit(outside)).not.toThrow();
  });

  test('invalid key names are rejected', () => {
    useKeyDir(makeTempDir('7b-custody-'));
    expect(() => devKeyPaths('../escape')).toThrow(/invalid dev key name/);
    expect(() => devKeyPaths('has space')).toThrow(/invalid dev key name/);
  });
});
