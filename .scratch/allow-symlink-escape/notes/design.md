# allow-symlink-escape — implementation notes

Spec: openspec/changes/allow-symlink-escape/specs/output-write-symlink-policy/spec.md
Tickets: .scratch/allow-symlink-escape/issues/01..04

## Semantics

- "escape" = `writablePathEscapesRoot({rootPath, targetPath})` returns true, i.e. the
  writable path's realpath lands outside the output root (or a link on the way is
  dangling / cyclic, which that helper reports as an escape).
- `allowSymlinkEscape` only changes the "escape -> refuse" step. When on, the guard
  returns false (write/delete proceeds through the link). Dangling links and cycles are
  already reported as escapes by `writablePathEscapesRoot`, so they stay refused under
  the switch too — no extra code needed.
- Project scope: setting the switch must warn once and be ignored; project-mode write and
  sweep behavior is byte-identical. Do NOT let the flag reach a project-scope run.

## Exact change list (core, ticket 01)

1. `src/config/config.ts`
   - `ConfigFileSchema` (search for `global: optional(z.boolean())` in the config-file
     schema, NOT `ConfigParamsSchema`): add
     `allowSymlinkEscape: optional(z.boolean()),` right after `global`.
   - `ConfigParamsSchema`: add `allowSymlinkEscape: optional(z.boolean()),`.
   - private field `allowSymlinkEscape: boolean`, constructor param, assignment
     `this.allowSymlinkEscape = allowSymlinkEscape ?? false;`.
   - getter `public getAllowSymlinkEscape(): boolean`.
   - Check `ConfigResolverResolveParams` includes it automatically (it extends
     `ConfigParams`); add a test in `src/config/config-resolver.test.ts` for
     CLI > local > base precedence.
2. `src/config/config-resolver.ts` — mirror how `simulateSkills` is resolved from
   base/local/CLI. Verify `loadConfigFromFile` treats it like `global` (base+local, not
   CLI-only) if `global` is handled specially there.
3. `src/cli/program.ts`
   - `.option("--allow-symlink-escape", ...)` on BOTH `generate` and `convert`
     commands (convert needs it for ticket 04). Add `--allow-symlink-escape=false`
     support: commander supports `--flag` and `--no-flag`; for explicit
     `--flag=false` add a custom parsing or check the existing `--dry-run` style.
     Look at how `--simulate-skills` is declared and follow that pattern; if commander
     cannot express `=false`, use `.option("--allow-symlink-escape <boolean>")` — but
     the spec requires `--allow-symlink-escape=false` to mean off, so prefer a boolean
     option with a custom default. Check `src/cli/program.ts` line ~307-340 for the
     generate command and ~220-230 for convert.
4. `src/types/feature-processor.ts`
   - Add `protected readonly allowSymlinkEscape: boolean;` to `FeatureProcessor`,
     constructor param `allowSymlinkEscape = false`, assignment.
   - Guard functions get an optional `allowSymlinkEscape = false` param:
     - `refusesWriteOutsideRoot({ logger, rootPath, targetPath, allowSymlinkEscape = false })`:
       if escape && allowSymlinkEscape -> `logger.debug(...)` (observability, spec
       "可观测性") and return false; else warn and return true.
     - `refusesAnyWriteOutsideRoot({ ..., allowSymlinkEscape = false })` forwards.
     - `refusesDirWriteOntoRoot({ ..., allowSymlinkEscape = false })`: forward to
       `refusesWriteOutsideRoot`. (It is private; only called by
       `DirFeatureProcessor.writeAiDirs`. The switch must let a directory unit whose
       parent lands on the root itself be written when opted in? NO — that guard is
       about a link landing ON the root. Keep it strict: only forward
       `allowSymlinkEscape` to the `refusesWriteOutsideRoot` call it already makes.)
     - `refusesDeleteOutsideRoot` (private, used by `removeOrphanAiFiles`): add
       `allowSymlinkEscape` param; when on, skip the refusal (return false) so the
       orphan sweep can delete through the link.
   - `writeAiFiles`: pass `allowSymlinkEscape: this.allowSymlinkEscape`.
   - `removeOrphanAiFiles`: pass it to `refusesDeleteOutsideRoot`.
   - Debug log on passthrough: `this.logger.debug(`Writing through a symbolic link: ${targetPath} -> realpath outside ${rootPath}`)` or similar, in the guard, at debug level.
5. `src/types/dir-feature-processor.ts`
   - Add `protected readonly allowSymlinkEscape: boolean;`, ctor param, assignment.
   - `writeAiDirs`: pass to `refusesAnyWriteOutsideRoot` and `refusesDirWriteOntoRoot`.
   - `removeOrphanDirs` / `removeOrphanFilesInAiDirs` / `removeOrphanFlatFiles`:
     wrap the `assertWritablePathInsideRoot` calls in
     `if (!this.allowSymlinkEscape) { await assert... }` so the sweep proceeds through
     the link. Keep every lexical guard (`locateInOwnRoot`, `ownsDirTree`,
     `generatedPaths`) intact.
6. `src/lib/generate.ts` — pass `allowSymlinkEscape: config.getAllowSymlinkEscape()`
   to EVERY `new <Processor>({...})` construction (12 sites listed by
   `grep -n "new \\w+Processor(" src/lib/generate.ts`) and to the shared-config
   gateway creation at line ~1203. Also pass it to
   `createOrphanSweepPlan({ logger })` if the sweep plan needs it (see below).
7. `src/lib/orphan-sweep.ts` — the sweep plan asserts writability in several places
   (search `assertWritablePathInsideRoot` inside it). It must accept
   `{ logger, allowSymlinkEscape = false }` and skip those assertions when on.
   Otherwise the deferred deletion plan refuses a path the writer just allowed.
8. Shared output-surface guards (ticket 02):
   - `src/features/shared/antigravity-plugin-manifest.ts` — the exported helper takes
     `logger`; add `allowSymlinkEscape` param and forward to
     `refusesWriteOutsideRoot`. Check its callers in `src/lib/generate.ts` (~line 909
     region) and pass `config.getAllowSymlinkEscape()`.
   - `src/features/shared/hermes-project-plugin-activation.ts` — same, exported
     `writeProjectPluginActivation`; callers pass `configRoot`. Add
     `allowSymlinkEscape` param, forward to the guard. Caller in `src/lib/generate.ts`
     (search `writeProjectPluginActivation`).
   - `src/features/commands/commands-processor.ts` lines ~1314 and ~1351: pass
     `this.allowSymlinkEscape`.
9. Tests (ticket 01):
   - `src/config/config-resolver.test.ts`: precedence CLI > local > base.
   - `src/types/feature-processor.test.ts`: `refusesWriteOutsideRoot` with
     `allowSymlinkEscape: true` returns false and does not warn; false warns as today.
     Keep the existing message text unchanged.
   - A co-located test with a pseudo-home + symlinked tool directory: switch on -> file
     written at the link target; off -> warn + skip. Use
     `setupTestDirectory({ home: true })` and mock `getHomeDirectory`. Follow the
     existing "Refusing to write ... resolves outside" tests in
     `src/types/feature-processor.test.ts` as the precedent.
   - Dangling link + cycle: switch on still refuses (both via the guard returning true).
   - Project scope: config with `allowSymlinkEscape: true` and no `--global` -> warn
     once and ignore. Check `src/config/config.test.ts` for the warn-once precedent
     (search `warnOnceWithFallback`).
10. `pnpm run generate:docs-content` is NOT needed; docs are edited by hand in
    `docs/**`. `config-schema.json` is gitignored and generated by
    `scripts/generate-json-schema.ts` (run `pnpm run generate:json-schema` if a script
    exists; check `package.json` scripts). It already contains the key from a previous
    run — regenerate to be safe.

## Ticket 02 (dir units + config rewrites)

- Skills directories are written by `DirFeatureProcessor.writeAiDirs`
  (`src/types/dir-feature-processor.ts` ~line 270-330). The unit is held whole when any
  file escapes: `refusesAnyWriteOutsideRoot` already does that; passing
  `allowSymlinkEscape` makes the whole unit write through.
- `src/features/skills/skills-processor.ts`: sweep layers at lines 1412, 1449, 1527
  (root load layer, per-skill dir layer, flat-file layer). Wrap each
  `assertWritablePathInsideRoot` in `if (!this.allowSymlinkEscape)`.
- Tests: `src/features/skills/skills-processor.test.ts` — co-located on/off pair,
  following the existing "Refusing to write ... resolves outside" cases.

## Ticket 03 (orphan sweep)

- Guard layers: `src/features/skills/skills-processor.ts` 1412/1449/1527,
  `src/types/dir-feature-processor.ts` 552/553,
  `src/features/subagents/subagents-processor.ts` 1318/1396,
  `src/lib/orphan-sweep.ts` (all `assertWritablePathInsideRoot`).
- Links themselves are never deleted: `removeDirectory`/`removeFile` act on the spelled
  path; the skills root link is skipped by `listSubdirectoryNames(..., {followSymbolicLinks:false})`
  and the directory sweep only removes subdirectories of the link, not the link.
- POSIX-only e2e: follow the existing `skipIf(win32)` precedent (search
  `skipIf(process.platform === "win32")`).
- Project-mode sweep refusals must not regress (Kimi project-mode e2e).

## Ticket 04 (convert + docs)

- `src/cli/program.ts` convert command needs `--allow-symlink-escape` (do it in 01).
- `src/cli/commands/convert.ts` passes options through `ConfigResolver.resolve`, so no
  change needed beyond the CLI flag. Verify the import side follows links
  (`src/lib/sources.ts`) — it already does.
- Docs: `docs/reference/file-formats.md` (Symlinks section), `docs/reference/cli-commands.md`,
  `docs/guide/configuration.md`, `docs/guide/separate-input-root.md`. Then
  `pnpm run generate:docs-content` to refresh `src/generated/docs-content.ts` (CI fails
  on drift).
- Env-override roots: `HERMES_HOME` / `KIMI_CODE_HOME` / `DEEPAGENTS_HOME` — the escape
  check uses `resolveToolOutputRoot`, which already applies the override, so the check is
  relative to the overridden root. Verify with a test if cheap.
- `pnpm cicheck` at the end.
