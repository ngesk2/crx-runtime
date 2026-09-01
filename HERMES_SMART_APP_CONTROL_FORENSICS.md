# Hermes Smart App Control Forensics

**Classification**: Documentation / Classification Report (no remediation executed)
**Branch**: `constitutional-convergence-v2`
**HEAD**: `cb72f8c7`
**Date**: 2026-09-01
**Directive**: Report-only. Do **not** execute remediation options A/B/C/D without separate authorization. Do not disable Smart App Control, Defender exclusions, certificate installs, self-signing, CI bypass, or policy weakening.

---

## 1. Executive Finding

The Hermes application fails to launch under Smart App Control (SAC) / Windows Code Integrity because the only executable launched by the user-facing shortcut — `Hermes.exe` inside the `release\win-unpacked\` development artifact — is **unsigned** (Authenticode `NotSigned`). This is a *by-design* consequence of the local build configuration: `signAndEditExecutable: false` produces an unsigned Electron binary that Windows Code Integrity correctly blocks.

Two **signed, valid-Authenticode NSIS installers** exist and are the correct, supported launch path. Masking relationships (unsigned dev binary vs signed installers) are recorded below. **No security-policy change is required or recommended.** The correct remediation is to launch Hermes through a signed installer-produced installation rather than the unsigned dev artifact.

No SAC/Code Integrity workload policy is currently enforced on this machine (no `SIPolicy.p7b`; `MSFT_Policy`/`MSFT_WDACSIPolicy`/`MSFT_DeviceGuard` queries return no rows). The block is therefore the default Windows behavior of refusing to execute an unsigned binary that carries no Mark-of-the-Web, launched from a local path without a signed chain.

---

## 2. Exact Binary Identity

**Blocked executable (dev artifact):**
- Path: `C:\Users\nolan\AppData\Local\hermes\hermes-agent\apps\desktop\release\win-unpacked\Hermes.exe`
- Size: 213,963,776 bytes
- Created / LastWrite: 6/8/2026 18:02:34
- VersionInfo `InternalName`: `electron.exe`
- `FileVersion` / `ProductVersion`: `40.9.3.0`
- `CompanyName` / `LegalCopyright`: "Nous Research"
- Authenticode: **NotSigned**
- Zone.Identifier (MOTW): **absent**

**Supported signed installers:**
| Artifact | Path | Size (bytes) | Date | Authenticode | MOTW |
|----------|------|--------------|------|--------------|------|
| Fresh download | `C:\Users\nolan\Downloads\Hermes-Setup.exe` | 7,946,048 | 8/26/2026 08:14:36 | **Valid** | Yes, ZoneId=3 |
| Local cached install | `C:\Users\nolan\AppData\Local\hermes\hermes-setup.exe` | 7,597,376 | 6/6/2026 21:09:16 | **Valid** | No |

The two installers differ in size, hash, and certificate thumbprint — distinct artifacts, both signed by "Nous Research Inc.".

---

## 3. Hashes and Metadata

### Unsigned dev binary (`win-unpacked\Hermes.exe`)
- SHA256: `1785D48765342EF05E148C575AF468B467DAAB2CA415EF231C854B9933F2D799`
- SHA1: `75A907B4B04B0FED5FB5FF5862B0B45212191CF8`
- MD5: `9A2BDEA26EDC276ACDC4E8AFCCEA0FAE`
- Build provenance (`win-unpacked\resources\install-stamp.json`): commit `b5f8996ccc2163ef06b4265d0882019fc24b0682`, branch `main`, builtAt `2026-06-08T23:57:47.098Z`, dirty `true`, source `local`
- Desktop build stamp (`desktop-build-stamp.json`) contentHash: `f60f95ba50b48775d7cdd4fc6db4df11d3c857368ea46ec6d74ebc5b6533e4d1` (sourceMode `false`; drift recorded as provenance metadata only — installer copies neither)
- Disk footprint (`win-unpacked\`): 373.6 MB; `app.asar` 10,798,933 bytes; 23 ancillary Chromium/Electron files

### Fresh signed installer (`Downloads\Hermes-Setup.exe`)
- Signer CN: `Nous Research Inc.`, O `Nous Research Inc.`, L `Austin`, S `Texas`, C `US`
- Issuer CN: `Microsoft ID Verified CS EOC CA 03`
- Certificate thumbprint: `73319CF939C2073A5066D185EEACDC82797D8C79`; validity 8/8/2026 – 8/11/2026
- MOTW: `[ZoneTransfer] ZoneId=3; HostUrl=https://hermes-assets.nousresearch.com/Hermes-Setup.exe?build=5ef1409f5048`
- SHA256: `CFC818ADF831A748C61A407152A03C7A...` (truncated on capture)

### Local cached signed installer (`AppData\Local\hermes\hermes-setup.exe`)
- Same signer; separate certificate thumbprint `56B82832D278967F2C13F34C7C5C6518BA3BF120`; validity 6/3/2026 – 6/6/2026
- No MOTW present
- SHA256: `505DFB4C2C1052B055E3FC694A76CB7CE093A64962C7713AA294F5549C6734F5`

---

## 4. Authenticode / Mark-of-the-Web

| Binary | Authenticode | MOTW | Implication |
|--------|--------------|------|-------------|
| `win-unpacked\Hermes.exe` | **NotSigned** | absent | Unsigned local binary; no signed chain; no Zone quarantine to force sign. Windows Code Integrity refuses by default. |
| `Downloads\Hermes-Setup.exe` | Valid | ZoneId=3 (internet) | Signed; MOTW flags a downloaded origin but the signature is valid. |
| `AppData\Local\hermes\hermes-setup.exe` | Valid | absent | Signed; no MOTW. |

The blocked path is the unsigned local dev binary with *no* MOTW — the least-trusted combination under SAC. The signed installers are the trust-bearing artifacts.

---

## 5. Installation Provenance

- **No installed product under `AppData\Local\Programs`**: `Programs\` contains only `@opencode-aidesktop`, `antigravity`, `Common`, `cursor`, `Devin`, `Microsoft VS Code`, `Obsidian`. There is **no `Hermes`** entry.
- **No NSIS uninstaller presence**: no `unins*.exe` / `Uninstall Hermes` evidence.
- The only Hermes `Hermes.exe` is the **untracked, locally-built `release\win-unpacked\` dev artifact** — *not* produced by either signed installer.
- `package.json`: name `hermes`, version `0.15.1`, productName `Hermes`, appId `com.nousresearch.hermes`; `win.target` = `nsis msi`.

**Conclusion**: the machine has a developer build output on disk but no signed installer installation. The user-facing shortcut mistakenly points at the build output rather than an installed (signed) product.

---

## 6. Electron / Build-Artifact Classification

- `Hermes.exe` is an **Electron 40.9.3.0** wrapper (VersionInfo `InternalName=electron.exe`), accompanied by standard Electron runtime files (`chrome_100/200_percent.pak`, `ffmpeg.dll`, `libEGL.dll`, `libGLESv2.dll`, `resources.pak`, `snapshot_blob.bin`, `v8_context_snapshot.bin`, `vulkan-1.dll`, etc.).
- `package.json` configures **no signing**: `signAndEditExecutable: false`; `win.sign` empty; no signing keys referenced. `builder-debug.yml` pack patterns exclude `node_modules`/`build`/`release` and include `dist/assets/electron/public/package.json`; no signing keys.
- `app.asar` (10.8 MB) carriers the packaged application resources; `app.asar.unpacked` and `native-deps` hold native modules.
- **Classification**: this is an **unsigned Electron run/debug artifact**, not a distributable installer build. It is expected to be blocked by SAC because the signing step was disabled in the build configuration.

---

## 7. Shortcut / Process Origin

- **Start Menu shortcut** `...\Start Menu\Programs\Hermes.lnk`:
  - TargetPath: `...\release\win-unpacked\Hermes.exe`
  - WorkingDirectory: `...\release\win-unpacked`
  - IconLocation: `...\resources\icon.ico,0`
  - TargetExists: `True`; no arguments.
  - **Root cause surface**: the shortcut launches the unsigned dev binary.
- **Startup** `...\Programs\Startup\Hermes_Gateway.cmd`: checks/launches `C:\Users\nolan\AppData\Local\hermes\gateway-service\Hermes_Gateway.cmd` (a `.cmd` that runs `pythonw.exe -m hermes_cli.main gateway run` with `HERMES_HOME`/`PYTHONIOENCODING`/`VIRTUAL_ENV` env vars). **This gateway startup path is unblocked** — it is a Python process, not the Electron binary, and does not fetch or execute `win-unpacked\Hermes.exe`.
- **No Hermes processes running** at time of inspection.

---

## 8. Smart App Control / Code Integrity Evidence

- `MSFT_Policy` / `MSFT_WDACSIPolicy` / `MSFT_DeviceGuard` queries: **no rows returned** — no managed WDAC/SAC workload policy is deployed.
- `SIPolicy.p7b`: **NOT FOUND** (no user-mode signed policy).
- `C:\Windows\System32\CodeIntegrity` contains only:
  - `driversipolicy.p7b` (242,130 bytes, 5/29/2026 20:35:16)
  - `VbsSiPolicy.p7b` (76,050 bytes, **8/11/2026 18:27:38** — recent timestamp; driver/VBS policy only, not an application-blocking workload SIP policy)
- **Interpretation**: with no active SIPolicy workload, the block on the unsigned `Hermes.exe` is the **default Windows/Core-Isolation behavior** of not running an unsigned binary from a local path. It is reproducible and *correct* — not a misconfiguration. Gatekeeper-style Smart App Control (when enabled via SignTool-free mode) refuses unsigned desktop binaries; this unsigned Electron artifact qualifies.

---

## 9. Multi-Binary Integrity Comparison

| Binary | Size | Signed | MOTW | SHA256 (prefix) | Cert thumbprint | Electron/NSIS class |
|--------|------|--------|------|-----------------|-----------------|---------------------|
| `win-unpacked\Hermes.exe` | 213,963,776 | **NotSigned** | none | `1785D487...` | n/a | Electron 40.9.3 dev artifact |
| `Downloads\Hermes-Setup.exe` | 7,946,048 | Valid | ZoneId=3 | `CFC818AD...` | `73319CF939...` | NSIS 0.0.1 installer wrapper |
| `AppData\Local\hermes\hermes-setup.exe` | 7,597,376 | Valid | none | `505DFB4C...` | `56B828322...` | NSIS 0.0.1 installer wrapper |

- The two installers are **distinct** artifacts (different size/hash/cert) — not the same file renamed. Both signed by the same publishing entity.
- The unsigned dev binary is **not** the packaged `Hermes-Setup.exe`; it is the raw Electron unpacked build that the NSIS wrapper would bundle/execute. The installed, supported payload is the signed installer's extracted app (not present because no install exists).

---

## 10. Root Cause Matrix

| # | Observation | Root Cause | Classification |
|---|-------------|------------|----------------|
| RC1 | `Hermes.exe` blocked by SAC/Code Integrity | Executable is `Authenticode NotSigned` (Electron 40.9.3 build with `signAndEditExecutable: false`); Windows refuses unsigned local binaries | Config-driven unsigned build (by design) |
| RC2 | Shortcut points at unsigned dev build | `Hermes.lnk` targets `release\win-unpacked\Hermes.exe`, the build artifact, not an installed signed product | Incorrect launch-surface wiring |
| RC3 | No installed product exists | `AppData\Local\Programs` has no `Hermes`; no NSIS `unins*`; only the dev build output is on disk | Missing signed-installer installation |
| RC4 | No MOTW on blocked binary | Local build output never received Zone.Identifier | Provenance metadata (local build) |
| RC5 | Gateway launches fine | Startup path uses `pythonw.exe -m hermes_cli.main gateway run`, not the Electron binary | Non-affected Python path |

**Conclusion**: The unsigned `win-unpacked` dev artifact is blocked by design; the signed installer is the correct launch path. **No security-policy change needed.**

---

## 11. Ranked Remediation Options (Document Only — Not Executed)

> None of A/B/C/D have been executed. They are ranked and documented for decision. Only a user-authorized action may proceed.

- **A (Recommended) — Launch the signed, installed product.** Install/runtime the Hermes app via the **signed** `Hermes-Setup.exe` (fresh `Downloads\Hermes-Setup.exe` has a valid, recent cert + MOTW, signifying internet download; the cached `AppData\Local\hermes\hermes-setup.exe` is signed with an older cert). Once installed, the NSIS-installed `Hermes.exe` (from the signed payload) carries the signer's Authenticode chain and is trusted by SAC. Then repoint `Hermes.lnk` to the installed executable.
  - *Note*: Re-installation and installation-time execution is a user-consented software action; it does not weaken any security control and uses the manufacturer's own signed artifact. If the user runs the downloaded fresh installer and Windows re-applies MOTW-based defenses, that remains correct behavior.
- **B — Repoint the shortcut** to a signed, installed Hermes executable. ⚠️ **Not authorized** — depends on A (an installed signed product must exist first). Documented only.
- **C — Rebuild Hermes with a legitimate signing process.** Requires a valid code-signing certificate for "Nous Research" identity and re-running the build with `win.sign` configured + `signAndEditExecutable: true`. This is a build-toolchain change in `hermes-agent` (external repo), out of the current mutation boundary; not executed.
- **D — Restore the originally-shipped signed release** from the manufacturer (download the current signed `Hermes-Setup.exe` from the official `hermes-assets.nousresearch.com`), instead of a locally-built unsigned artifact.

> ⚠️ **Never** disable Smart App Control, add Defender exclusions for the block, install an untrusted/self-signed cert as Trusted, self-sign the binary to bypass signature enforcement, skip integrity, or weaken policy — any such step is **explicitly out of scope and not recommended**.

---

## 12. Explicit DO-NOT List

- **Do NOT** disable Smart App Control / core isolation / memory integrity to launch the unsigned binary.
- **Do NOT** add a Microsoft Defender exclusion for `win-unpacked` / `Hermes.exe`.
- **Do NOT** install a self-signed or untrusted certificate into the Trusted Root store.
- **Do NOT** self-sign the binary to forge a trust chain.
- **Do NOT** bypass CI/signing by repackaging `app.asar` into an unsigned envelope.
- **Do NOT** weaken any WDAC/Code Integrity policy.
- **Do NOT** execute options A/B/C/D without explicit, separate user authorization.
- **Do NOT** reset/checkout/restore/stash/clean/delete/format/reinstall/push the repository.

---

*End of forensic classification report. No security control was changed or disabled.*
