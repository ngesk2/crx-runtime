/**
 * DEV-ONLY file key custody for the Patch 7B 24-hour proof.
 *
 * WARNING: this module exists ONLY for the development proof. It stores
 * Ed25519 private keys as files so Nolan's/Alice's/Bob's dev identities can
 * sign PING events during the sprint. It is NOT the production PING key
 * architecture. Production custody (OS keystore, Stronghold, HSM, Vault,
 * WebAuthn/passkey-derived, remote signer) is a deferred decision.
 *
 * Hardening rules enforced here:
 * - Default location is OUTSIDE any git working tree:
 *   $PING_DEV_KEY_DIR, or ~/.ping-dev-keys when unset.
 * - Directory is created with mode 0700 and re-enforced on every use.
 * - Private key files are written with mode 0600 and re-enforced on every use.
 * - FAIL CLOSED: if the resolved key directory sits inside tracked git
 *   content (a worktree where it is not ignored), every operation throws.
 * - Private key material NEVER goes into: ping_events, projection tables,
 *   HTTP payloads, logs, fixtures, git, agent context, Qdrant, evidence blobs.
 *   This module only ever writes the key files and returns key material to
 *   the local calling process.
 *
 * Do not import this module from production runtime paths.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';

export interface DevKeypair {
  public_key: string;
  private_key: string;
}

export interface DevKeyPaths {
  dir: string;
  privateKey: string;
  publicKey: string;
  metadata: string;
}

const NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

/**
 * Resolve the dev key directory. Prefers $PING_DEV_KEY_DIR so operators can
 * point it anywhere outside the repo; defaults to ~/.ping-dev-keys.
 */
export function getDevKeyDir(): string {
  const raw = process.env.PING_DEV_KEY_DIR || path.join(os.homedir(), '.ping-dev-keys');
  return path.resolve(raw);
}

/**
 * Nearest existing ancestor of a path (for git containment checks on paths
 * that do not exist yet).
 */
function nearestExistingAncestor(p: string): string {
  let cur = path.resolve(p);
  for (;;) {
    if (fs.existsSync(cur)) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) return cur;
    cur = parent;
  }
}

/**
 * FAIL CLOSED if dir resolves inside tracked git content.
 * Throws when dir is inside a git worktree and is not ignored there.
 * Passes when dir is outside any worktree, or is git-ignored inside one.
 */
export function assertDevKeyDirOutsideTrackedGit(dir: string): void {
  const probeCwd = nearestExistingAncestor(dir);
  let topLevel: string;
  try {
    topLevel = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: probeCwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return; // not inside a git worktree: acceptable
  }
  const realDir = path.resolve(dir);
  const realTop = fs.realpathSync(topLevel);
  const inside = realDir === realTop || realDir.startsWith(realTop + path.sep);
  if (!inside) return;
  // check-ignore with a trailing-slash dir pattern only matches paths git
  // can see as directories; a not-yet-created dir needs the trailing probe.
  const ignoreProbes = [realDir, realDir + path.sep];
  for (const probe of ignoreProbes) {
    try {
      execFileSync('git', ['check-ignore', '-q', probe], {
        cwd: realTop,
        stdio: ['ignore', 'ignore', 'ignore'],
      });
      return; // ignored inside the worktree: acceptable
    } catch {
      // try the next probe form
    }
  }
  throw new Error(
    `DEV KEY CUSTODY FAIL-CLOSED: ${realDir} is inside tracked git content ` +
      `(${realTop}) and is not ignored. Set PING_DEV_KEY_DIR to a directory ` +
      `outside the repository. Refusing to store private keys here.`
  );
}

/**
 * Ensure the dev key directory exists with 0700, after the fail-closed check.
 */
export function ensureDevKeyDir(): string {
  const dir = getDevKeyDir();
  assertDevKeyDirOutsideTrackedGit(dir);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.chmodSync(dir, 0o700);
  return dir;
}

function checkName(name: string): void {
  if (!NAME_PATTERN.test(name)) {
    throw new Error(`invalid dev key name: ${name}`);
  }
}

/**
 * Paths for a named dev keypair. Ensures the directory first.
 */
export function devKeyPaths(name: string): DevKeyPaths {
  checkName(name);
  const dir = ensureDevKeyDir();
  return {
    dir,
    privateKey: path.join(dir, `${name}.private.hex`),
    publicKey: path.join(dir, `${name}.public.hex`),
    metadata: path.join(dir, `${name}.json`),
  };
}

/**
 * Persist a dev keypair. Private key file is 0600; metadata never contains
 * private key material.
 */
export function saveDevKeypair(
  name: string,
  keypair: DevKeypair,
  metadata: Record<string, any> = {}
): DevKeyPaths {
  const p = devKeyPaths(name);
  fs.writeFileSync(p.privateKey, keypair.private_key + '\n', { mode: 0o600 });
  fs.chmodSync(p.privateKey, 0o600);
  fs.writeFileSync(p.publicKey, keypair.public_key + '\n', { mode: 0o644 });
  const meta = {
    name,
    ...metadata,
    saved_at: new Date().toISOString(),
    key_format: 'ed25519-pkcs8-der-hex',
  };
  if ('private_key' in meta) {
    throw new Error('DEV KEY CUSTODY FAIL-CLOSED: refusing to write private key into metadata');
  }
  fs.writeFileSync(p.metadata, JSON.stringify(meta, null, 2) + '\n', { mode: 0o600 });
  return p;
}

/**
 * Load a dev keypair back into the local process. Never logs the material.
 */
export function loadDevKeypair(name: string): DevKeypair {
  const p = devKeyPaths(name);
  return {
    public_key: fs.readFileSync(p.publicKey, 'utf8').trim(),
    private_key: fs.readFileSync(p.privateKey, 'utf8').trim(),
  };
}

/**
 * Whether a named dev keypair exists.
 */
export function devKeyExists(name: string): boolean {
  const p = devKeyPaths(name);
  return fs.existsSync(p.privateKey) && fs.existsSync(p.publicKey);
}
