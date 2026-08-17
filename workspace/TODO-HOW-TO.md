# 🛠 Runbook — Fixing a TODO

> Read this before you touch a bug listed in [TODO.md](TODO.md). One TODO per session. Don't batch. Don't push.

**Golden rule: reproduce before you fix.** A bug you can't reproduce locally is a bug you can't verify you fixed. If reproduction fails, that itself is a finding worth journaling — re-classify the entry rather than guessing.

**Paths you'll need:**

| What                       | Where                                                                   |
| -------------------------- | ----------------------------------------------------------------------- |
| ClassCAD source tree       | `~/dev/awv/classcad`                                                        |
| `cclass` server-side logic | `~/dev/awv/classcad/cclasses/Source/` (git submodule — see "Repo layout")   |
| C++ runtime                | `~/dev/awv/classcad/runtime/Source/`                                        |
| Build script               | `~/dev/awv/classcad/runtime/build.sh`                                       |
| Build presets              | `~/dev/awv/classcad/runtime/CMakePresets.json`                              |
| Built binary (arm64 macOS) | `~/dev/awv/classcad/runtime/output/arm64-osx-clang/release/classcad-cli`    |
| Training harness           | `~/dev/awv/classcad-agent/scripts/run.mjs`                       |
| Past journals              | `~/dev/awv/classcad-agent/workspace/training/`                   |
| classcad VS Code settings  | `~/dev/awv/classcad/.vscode/settings.json` (the formatting source of truth) |
| classcad tests             | `~/dev/awv/classcad/cclasses/Source/Tests/UnitTesting/`                     |
| clang-format config        | `~/dev/awv/classcad/runtime/.clang-format`                                  |

### Repo layout — `cclasses/` is a submodule

`~/dev/awv/classcad/cclasses/` is a **git submodule** with its own remote and history. This matters for every step that touches `.cclass` files:

- `git status` / `git diff` at `~/dev/awv/classcad` will NOT show your `.cclass` edits — they only show a `M cclasses` line indicating the submodule moved. Run all git operations on `.cclass` files from **inside** `~/dev/awv/classcad/cclasses/`.
- C++ edits (under `runtime/Source/`) live in the parent repo at `~/dev/awv/classcad/`.
- Most TODOs are `.cclass` fixes, so the fix branch lives in `cclasses/`. If a TODO needs both runtime and cclass changes, you'll have two branches in two repos.

### `.cclass` files load at runtime — no rebuild needed for cclass-only fixes

The worker reads `.cclass` files directly from `~/dev/awv/classcad/cclasses/Source/` at startup (per `.classcad.ini`'s `system` key). Edit → restart worker → test. **You only need `bash build.sh` if you changed `runtime/Source/` (C++).** Don't rebuild for a cclass-only fix; it just wastes 1–5 minutes.

### Repo conventions — read before editing files in `~/dev/awv/classcad`

This repo was built on Windows and still carries Windows conventions in its source files. Editing without honoring them produces noisy diffs and can break the build (umlauts in error strings, etc.).

- **File encoding.** Per `~/dev/awv/classcad/.vscode/settings.json`:
  - `.cclass`, `.cpp`, `.hpp` files are **windows-1252** (not UTF-8). The `.cclass` XML prolog explicitly declares `encoding="ISO-8859-1"` (≈ windows-1252 for the bytes that matter here).
  - Everything else is UTF-8.
  - Most existing files are pure ASCII (so the encoding doesn't matter byte-for-byte), but anything with German umlauts/ß or other Western-European chars will get corrupted if your editor saves as UTF-8. **Read/write these files in a tool that preserves the original bytes** — your standard `Edit` and `Read` tools are byte-exact, so as long as you don't paste new high-byte characters you're fine. If you need to add a German error message, encode it as windows-1252.
  - **Stay strictly ASCII in code/comments you add.** A single em-dash (`—`, UTF-8 `e2 80 94`) or en-dash (`–`) in a comment makes the cclass loader fail the entire proc with a generic compile error. Use `--` instead. After editing run `awk 'NR>=N && NR<=M' file.cclass | od -c | grep -E "3[0-7][0-7]"` to verify no high bytes leaked in.
- **Indentation varies file-by-file.** `editor.insertSpaces: false`, `editor.tabSize: 4`, `editor.detectIndentation: true`. In practice:
  - Some `.cclass` files use **literal tabs** inside CDATA bodies (e.g., `CurveAPI_v1.cclass`, `CurveAPITest_v1.cclass`).
  - Others use **4 literal spaces**.
  - `.cpp` / `.hpp` legacy files use literal tabs. New code should be formatted with clang-format (config at `~/dev/awv/classcad/runtime/.clang-format` — `UseTab: Never`, `IndentWidth: 2`, `BasedOnStyle: WebKit`).
  - **Always inspect bytes before editing.** Run `awk 'NR>=N && NR<=M' file.cclass | od -c | head` on the region you're touching — you'll see `\t` (tab) or `   ` (spaces) explicitly. Don't trust visual indentation in a viewer.
  - **Rule:** match the file's existing indentation. Don't auto-convert tabs ↔ spaces — that's a 1000-line diff for a one-line fix.
- **Line endings.** `.gitattributes` only enforces LF for `*.sh`. All existing C++/cclass files use LF in this checkout. **Do not introduce CRLF** even though the project is Windows-friendly — leave existing LF as LF.
- **clang-format binary.** The VS Code workspace points at `runtime/clang-format-17.exe` which is **Windows-only** (the comment in `settings.json` says so). On macOS, use a system `clang-format` (e.g. `brew install clang-format`, ideally v17 to match) or skip formatting and let CI catch it. Either way, only run clang-format on the files you actually changed — don't reformat the world.

### Step-by-step

1. **Pick the next unchecked TODO** — scan [TODO.md](TODO.md) top-down (highest severity first) for the first `[ ]` entry. Read its session reference, error text, trigger, and any workaround. **One TODO per session — do not batch.**

2. **Analyse before touching code.** Open the cited journal(s) under `workspace/training/<session>/`. Read what the original trainer tried, what they observed, and what they concluded. If the entry has a matching LLM doc at `knowledge/classcad-skill/references/<domain>/<api>.md`, read that too. Form a written hypothesis: _what is broken and why is it broken_. If after 15 minutes you have no hypothesis, search the source tree (`grep -rn '<api-name>\|<error-string>' ~/dev/awv/classcad/cclasses/Source ~/dev/awv/classcad/runtime/Source`).

3. **Start a fresh ClassCAD worker.** Default port `9094` is reserved for ph — if ph's worker is running you'll see it in `ps aux | grep 'classcad-cli worker'`, in which case start on an alternate port (see "Alternate-port worker" below). If port 9094 is free, just use the default:

   ```bash
   cd ~/dev/awv/classcad
   ./runtime/output/arm64-osx-clang/release/classcad-cli worker > /tmp/cc-bugfix.log 2>&1 &
   sleep 3
   ```

   Confirm it's up: `ps aux | grep 'classcad-cli worker' | grep -v grep`. The worker must be started with cwd at `~/dev/awv/classcad` so the relative paths in `.classcad.ini` (e.g. `./cclasses/Source`) resolve.

4. **Reproduce the bug.** Create a minimal repro script under a fresh training session: `workspace/training/YYYY-MM-DD_HH-MM-SS_fix-<short-name>/scripts/01-repro.mjs`. Run it through the harness:

   ```bash
   cd ~/dev/awv/classcad-agent
   node scripts/run.mjs workspace/training/<session>/scripts/01-repro.mjs --outdir workspace/training/<session>
   ```

   For **hang bugs** (the 💀 category), wrap every API call in a JS-side timeout (`Promise.race`) inside the repro script — otherwise the harness wedges and you have to `kill -9`. A 10-second timeout converts the hang into a visible `timeout 10000ms: ...` error.

   The bug **must reproduce locally** with the same symptom (hang, error message, return value) before you proceed. If it doesn't reproduce: stop, journal the discrepancy, and re-classify the TODO entry (maybe it was already fixed, maybe the trigger was wrong). Don't fabricate a fix for a bug you can't see.

5. **Quit the worker before editing source.** For `.cclass`-only fixes you don't technically need to recompile, but the worker has the old code in memory — kill it and start a fresh one after editing. For C++ changes the recompile (Step 7) requires the worker to be down anyway.

   ```bash
   kill $(ps aux | grep 'classcad-cli worker' | grep -v grep | awk '{print $2}')
   ```

   Hung workers (post-repro, 99% CPU) need `kill -9`.

6. **Find and fix the cause — root cause first, symptom only if still needed.** Most bugs live in:
   - `cclasses/Source/...` — `.cclass` XML files (procedural logic, dispatch tables, parameter validation). Edits commit inside the `cclasses/` submodule.
   - `runtime/Source/...` — C++ runtime helpers (CADH\_\*, IO\_\*, OBJ\_\_ primitives). Edits commit in the parent `classcad` repo.

   Grep for the failing API method, the exact error string, or the German error fragment (these are very specific). Read the failing proc top-to-bottom before changing a line.

   **Order of attack — root cause before symptom.** It's tempting to drop a one-line cclass guard at the entry point and call it done. Don't, not first. Trace one layer down (cclass → C++ wrapper → SMLib / other dependency) and ask *why* the lower layer misbehaved on this input. Common shapes:
   - The lower-layer API returned an error status that the wrapper discarded (uninitialised out-parameter then propagates as garbage).
   - The lower-layer API has documented preconditions the wrapper doesn't enforce.
   - A normalisation step (e.g. `Unitize` on a zero vector) silently produced NaN that's then walked by a numeric algorithm.
   - A consumed/freed ID is dereferenced because the wrapper didn't update its bookkeeping after a destructive op.

   Fix the root cause first. Then re-test with **no cclass guard** and decide whether the symptom patch is still needed:
   - If the root fix returns a proper error to the caller (non-empty `messages`, `maxLevel >= 51`) with no hang and no 100% CPU: **the symptom patch is not needed**. Skip it.
   - If the root fix just produces a silent no-op (call returns `maxLevel 31, messages: []` but nothing was created): **the symptom patch is still worth adding** — silent no-ops are hard to debug and the user-facing error message is real UX value.
   - If the root fix isn't possible in scope (closed-source dependency, broader risk), the cclass guard remains the only fix.

   **Sweep the affected siblings in one branch.** A root-cause fix often eliminates a hang for the symptom API *and* for sibling APIs that route through the same lower-layer function. If you're keeping cclass guards for UX (silent no-op case above), apply them to *every* sibling API hitting the same root cause — not just the one in the TODO entry. Better one well-scoped sweep than a TODO backlog of identical follow-ups. Mark every related/latently-affected TODO entry `[✅]` in TODO.md with the same branch SHAs and call them out in the commit message.

   **For input-validation guards in cclass APIs** (the symptom-patch shape), the existing pattern (used in `polyline2d` for planarity, in `AbstractAPI` for missing params) is:

   ```
   IF <invalid condition> THEN
       OBJ_ErrorMessage("Human-readable explanation.", 2, FALSE, ERR:NOTWELLDEFINED);
   ELSE
       <do the work>
   ENDIF
   ```

   Inside a `FORALL` over a batch, this skips bad items but lets valid ones proceed.

   **cclass language gotchas** (most failures here surface as a single line in `logs/classcad.log`: `[ERROR] 1 Fehler bei der Kompilation von Klasse: X Objekt: X.proc`, possibly preceded by a `[VERB] CodeGen::SimulateStackDepth: Stacksize < 0!`):
   - **Equality is `=`, not `==`.** `IF a == b THEN` parses but blows up codegen with `Stacksize < 0`. Use `IF a = b THEN`.
   - **No `BREAK` / no `CONTINUE`.** To early-exit a `FORALL` use a flag variable (e.g. `hasDup = TRUE`) and test it after the loop. `RETURN` inside `FORALL` sometimes works but has triggered the same `Stacksize < 0` codegen error — prefer flags.
   - **Array literals use braces, not brackets:** `[{0,0,0},{1,1,1}]` — outer `[]` for the array, inner `{}` for the point. JSON-style nested `[[0,0,0]]` only works at the API boundary, not inside test code.
   - **Point component accessor is `:` not `.`** — `pt:x`, `pt:y`, `pt:z`. (Object member access uses `.` — `lineParam.points`.)
   - **Iterate over `MAX(arr)` not `LEN(arr) - 1`.** `FOR i = 0 TO MAX(arr) DO ... NEXT` is the convention; `LEN(arr) - 1` parses but doesn't match existing code.
   - **No high-byte characters in comments or string literals.** See the encoding bullet above — a single em-dash in a comment breaks the whole proc.

   When a cclass change doesn't take effect, check `~/dev/awv/classcad/logs/classcad.log` — the worker logs the compile error there at first call to the broken proc, not at startup.

   **Same branch name across repos.** When the fix spans both `cclasses/` and `runtime/`, use the same branch name in both (e.g. `fix/curve-circle-zero-radius-hang`). The parent's `git status` will show `modified: cclasses (new commits)` and `modified: runtime (new commits)` — that's expected; ph reconciles the submodule pointers when landing. One *root cause* per session, even if it spans multiple TODO entries or multiple sibling APIs — that's still "one fix per branch."

7. **Compile (only if you touched C++), restart, verify. Iterate.**

   If you changed `.cclass` files only, skip this and jump to "restart". If you changed `runtime/Source/`:

   ```bash
   cd ~/dev/awv/classcad/runtime    # cwd MUST be runtime/ — CMakePresets.json is here
   bash build.sh arm64-osx-clang arm64-osx-clang-release
   ```

   (If config preset names look wrong, check `runtime/CMakePresets.json`.)

   Then restart the worker (Step 3 again) and re-run the repro script from Step 4. The repro must now succeed without the original symptom. **Add an inverse-test** to the same session folder if relevant — a script that confirms valid-input paths still work (so we know the fix didn't break the happy case).

   **MANDATORY: re-run the ORIGINAL journal's crash scripts against the fixed binary.** Your own repro script confirms *your* reproduction case is fixed; the original journal scripts confirm the *user-reported* case is fixed and your repro didn't accidentally diverge from the real bug. Locate them via the session reference in the TODO entry (e.g. `workspace/training/2026-04-07_00-00-00_interpolationCurve/scripts/06-duplicate-points.mjs`), run each one that previously hung/crashed, and assert each now:

   - returns within the harness timeout (no hang, no 100% CPU)
   - reports a clean error (`maxLevel >= 51`, non-empty `messages`, recognisable code)
   - matches the contract you documented in the commit message

   ```bash
   cd ~/dev/awv/classcad-agent
   for s in <list-of-crash-scripts-from-original-journal>; do
     echo "=== $s ==="
     timeout 20 node scripts/run.mjs workspace/training/<original-session>/scripts/$s.mjs --outdir /tmp/rerun-$s 2>&1 | grep -E "result:|messages:|maxLevel|FAILED|timeout"
   done
   ```

   Save the output to `workspace/training/<your-session>/files/original-journal-rerun.log` so the audit trail shows the user-reported scripts pass against the fix. If any original script still hangs/errors unexpectedly, the fix is incomplete — go back to Step 6.

   If the bug is not fixed: don't ship a half-fix. Repeat Step 6 with a sharper hypothesis. Iterate until the repro is clean.

8. **Add a regression test in classcad's own test framework.** classcad has a `CCTestCase`-based unit test framework under `~/dev/awv/classcad/cclasses/Source/Tests/UnitTesting/`. A fix isn't complete without a test that pins the bug.
   - Pick the right domain folder: `BaseModeling/` for assembly/part/solid/sketch, `CAD/` for curve, `Common/` for common, `BaseSystem/` for low-level, etc.
   - Find the relevant `*Test.cclass` (e.g. `AssemblyBuilderBasicAPITest.cclass`, `SketcherAPITest.cclass`, `FeatureAPITest.cclass`) and add a new test method, OR create a new `<Feature>RegressionTest.cclass` extending `CCTestCase` if no obvious home exists.
   - Test method shape (read existing tests for examples — they're concise). For an error-message assertion, wrap the API call in `LOG_OpenTryCatchScope` / `LOG_CloseTryCatchScope` so the framework doesn't treat the expected error as a real test failure:

     ```xml
     <code name="TestCurveCircleZeroRadiusRejected">
       <memberInfo visible="0" />
       <![CDATA[
     VAR res, mem;
     // Pre: clean drawing
     // Action: call the failing API inside a try-catch scope
     mem = LOG_OpenTryCatchScope();
     @CurveAPI_v1.circle({ id: shape, centerPos: {0,0,0}, radius: 0 });
     res = LOG_CloseTryCatchScope(mem);
     // Assert: the API now returns a clean error (or whatever the fix's contract is),
     //         and CRITICALLY the worker did NOT hang.
     CCUNIT_ASSERT_TRUE((LEN(res.messages) >= 1), "Should reject radius <= 0 with an error");
     IF LEN(res.messages) > 0 THEN
         CCUNIT_ASSERT_TRUE((res.messages[0].level >= 51), "Error level expected");
     ENDIF
     RETURN;
     ]]>
     </code>
     ```

   - **Run a single test** to verify your new method passes (the suite's `RunTestSuite` method does NOT auto-populate test cases — use `UnitTesterHeadless` as the dispatcher):

     ```bash
     ~/dev/awv/classcad/runtime/output/arm64-osx-clang/release/classcad-cli execute \
       --class UnitTesterHeadless --func PerformSingleTestFunc \
       -p <TestCaseClass> -p <testFuncName> -p /tmp/<result>.xml
     ```

     Each positional param needs its own `-p` flag — `-p a,b,c` packs them as a single string and breaks.

   - **The new test must pass against the fixed binary.** For non-hang bugs, also verify it fails against the pre-fix binary (`git stash` the fix, re-run, expect failure, unstash). **For hang bugs (💀): skip the pre-fix direction** — the test itself hangs in the SMLib/C++ call before the assertion framework can record a failure. The harness-side repro script (which has a JS-side timeout) is sufficient evidence that the bug existed. Note this in the journal.
   - **If classcad's test framework isn't usable for this specific bug** (e.g. the bug only manifests through the WebSocket transport, not via direct `classcad-cli execute`): note that in the journal, leave the harness-based repro script as the regression test, and proceed to Step 9 without a `.cclass` test.

   **Then run the entire test suite — every domain — and confirm all green before commit.** A fix that passes its own regression test but breaks an unrelated one is not done. Run each suite via `UnitTesterHeadless.PerformTestSuite`:

   ```bash
   for suite in BMTestSuite CADTestSuite CommonTestSuite \
                BaseSystemTestSuite FilerTestSuite LGS3DServiceTestSuite \
                GeneralTestSuite CocoRCompilerTestSuite SystemClassesTestSuite; do
     OUT="/tmp/${suite}-after.xml"
     echo "=== $suite ==="
     ~/dev/awv/classcad/runtime/output/arm64-osx-clang/release/classcad-cli execute \
       --class UnitTesterHeadless --func PerformTestSuite \
       -p $suite -p $OUT
     grep -E "<Tests>|<Failures>|<Errors>" "$OUT" | head -3
   done
   ```

   (If suite names look wrong, list them with `find ~/dev/awv/classcad/cclasses/Source/Tests/UnitTesting -name "*TestSuite.cclass"`. Copy each per-suite result XML to `workspace/training/<session>/files/testResult-<suite>-after-fix.xml`.)

   - **Sketcher tests live inside `BMTestSuite`** — there is no standalone `SketcherTestSuite` despite older docs suggesting one.
   - **Known environmental failure: `CADTestSuite`** — 4 `ClassCadKeyApp` tests (`testValidateClassCadKey{Native,Wasm}`, `testVerifyToken{Native,Wasm}`) fail on macOS because they depend on `CryptoDevServiced.dylib`, which is Windows-only. These predate any fix you're working on. Confirm by stashing your fix and re-running on master — if the failure set is identical, save both XMLs to the session folder, call it out in the commit, and proceed.
   - **If any other pre-existing test fails:** stop. Either your fix broke it, or it was already broken. Investigate before committing — do NOT commit on a red suite. If the failure pre-dates your change, prove it by re-running on master, capture both result XMLs, and only then proceed (and call out the pre-existing failure in the commit message).
   - **If the suite is huge or some tests need data files you don't have locally:** narrow to the suites covering the changed area (e.g. for a `BaseModeling/AssemblyBuilder*.cclass` fix → run `BMTestSuite` minimum), and explicitly journal which suites you ran and which you skipped + why. Do not silently skip.

9. **Branch + commit inside the right repo. DO NOT PUSH.** Preconditions: repro is clean, new regression test is green (or a documented reason it can't be), **and every suite you ran is green (or pre-existing-fail justified)**. If any precondition is unmet, go back — do not commit.

   For `.cclass`-only fixes, branch inside the submodule:

   ```bash
   cd ~/dev/awv/classcad/cclasses       # ← submodule, not parent
   git checkout -b fix/<api>-<short-symptom>     # e.g. fix/curve-circle-zero-radius-hang
   git add <only the files you touched>
   git commit -m "$(cat <<'EOF'
   fix(<area>): <one-line summary of the bug>

   Symptom: <what the user saw — error string / hang / silent no-op>
   Trigger: <minimum input that produces the bug>
   Root cause: <what was wrong in the source — function/file:line>
   Fix: <what you changed and why>
   Regression test: <path of the new *Test.cclass method, or "harness repro only — see <session>" if .cclass test wasn't feasible>
   Test suite: <list of suites run, all green — e.g. "BMTestSuite, CADTestSuite — all PASS except pre-existing ClassCadKeyApp failures"; or "BMTestSuite green, GeneralTestSuite skipped (no test data) — see journal">
   Verification: <how the repro script + test + full-suite run confirm the fix; reference the session folder>
   TODO entry: <the "### N. ..." header from cc/workspace/TODO.md>
   EOF
   )"
   ```

   For C++ changes, commit in the parent repo (`~/dev/awv/classcad/`). After committing in the submodule, the parent repo will show `M cclasses` indicating the submodule pointer moved — **leave that alone**; ph updates the submodule pointer when landing.

   **Do not `git push`.** ph reviews and lands these manually.

10. **Mark the TODO done.** In `~/dev/awv/classcad-agent/workspace/TODO.md`, find the entry header and replace `[ ]` with `[✅]`. Append a sub-bullet `- **Fixed:** classcad/cclasses <short SHA> on branch fix/...` so the audit trail survives even if the branch is squashed at merge.

11. **Sweep the LLM docs for residue.** Every API whose behavior changed needs its `knowledge/classcad-skill/references/<domain>/<api>.md` updated — both the API named in the TODO entry *and* any siblings you swept in step 6. Past trainers wrote these docs based on the buggy behavior, so they're full of stale warnings like "CRITICAL: hangs the server", "💀", "always kill -9", "validate before calling — no error is returned". After your fix, those are wrong: the call now returns a proper error.

    For each affected API doc:
    - **Remove** the crash/hang notice for the specific input you fixed (don't touch unrelated hang warnings — those bugs still exist).
    - **Add** the new behavior: error code, `maxLevel`, exact message string. Use the format the doc already uses for its other error-case tables.
    - **Update** the "always validate before calling" prescriptions — they're no longer load-bearing; the API now rejects invalid input itself.
    - **Be precise about scope.** If you fixed `radius <= 0` but not `angle < 0`, leave the angle warning intact. A doc that says "all of these crash, but actually only some still do" is worse than no doc.

    Commit doc updates as a **separate commit on the same fix branch** in the `cc` repo (the doc tree lives under `cc/knowledge/`, not in classcad):

    ```bash
    cd ~/dev/awv/classcad-agent
    git checkout -b fix/<api>-<short-symptom>     # same name as the classcad branches
    git add knowledge/classcad-skill/references/<domain>/<api>.md  # one or more
    git commit -m "docs(<area>): refresh after <api> radius<=0 hang fix"
    ```

    (If the cc repo doesn't have a fix branch yet, branch off master here too. Don't push.)

### Alternate-port worker (when port 9094 is taken or zombied)

`cc/TOOLS.md` references a `/Users/dev/dev/osx/.classcad-alt.ini` and an install at `/Users/dev/dev/osx/arm64-osx-release/` — those paths are stale on this checkout. The actual install lives at `~/dev/awv/classcad/runtime/output/arm64-osx-clang/release/`. If you actually need an alternate-port worker, copy the ini and edit ports:

```bash
cp ~/dev/awv/classcad/.classcad.ini /tmp/cc-alt.ini
sed -i '' 's/wport=9094/wport=9095/; s/hport=9094/hport=9095/' /tmp/cc-alt.ini   # if those keys exist
cd ~/dev/awv/classcad
./runtime/output/arm64-osx-clang/release/classcad-cli worker -i /tmp/cc-alt.ini > /tmp/cc-alt.log 2>&1 &
# Then point the harness at it:
node scripts/run.mjs <script> --outdir <dir> --port 9095
```

Most sessions don't need this — `kill -9` clears a hung worker cleanly in 99% of cases.

### Cleanup checklist (every session)

- [ ] Worker started for the bug-fix is killed (`ps aux | grep classcad-cli worker` shows nothing on alternate ports)
- [ ] Repro script lives at `workspace/training/<session>/scripts/01-repro.mjs` and reproduces cleanly against the FIXED binary as a regression test
- [ ] **Every crash/hang script from the ORIGINAL journal cited in the TODO entry has been re-run against the fixed binary**, all return within timeout, all report a clean error (or expected success). Output captured at `workspace/training/<session>/files/original-journal-rerun.log`. This is non-negotiable — your own repro alone isn't enough proof
- [ ] A new `*Test.cclass` method exists under `~/dev/awv/classcad/cclasses/Source/Tests/UnitTesting/` AND passes against the fixed binary (or the journal explains why a `.cclass` test was not feasible — e.g. hang bugs where the test itself would hang)
- [ ] **The full test suite was run and is green** — per-suite XML results saved to the session's `files/` folder. Any skipped suites are listed and justified in the journal. CADTestSuite's pre-existing `ClassCadKeyApp` failures are acknowledged in the commit, not silently passed through.
- [ ] `journal.md` exists in the session folder with: hypothesis → repro evidence → root cause → fix description → verification evidence (test result included)
- [ ] `~/dev/awv/classcad/cclasses` (and/or `~/dev/awv/classcad`) is on a `fix/...` branch with exactly one commit, not pushed
- [ ] No formatting/encoding noise in the diff — only the bytes you intended to change
- [ ] The TODO checkbox is `[✅]`, no others changed
- [ ] LLM docs under `knowledge/classcad-skill/references/<domain>/` for every API whose behavior changed are updated — stale hang/crash warnings removed for inputs you fixed, new error codes/messages documented. Sibling-API docs covered too. Doc updates are a separate commit on the same fix branch in the `cc` repo

### Recovery: split staging after `git stash pop`

If you stashed the fix to verify "fails on master" and the `git stash pop` left the file split between staged (fix) and worktree (master), recover with:

```bash
cd ~/dev/awv/classcad/cclasses
git checkout-index -f -- <file>      # worktree ← index (the fix)
git reset HEAD -- <file>             # unstage so the diff shows up as unstaged again
git diff <file>                      # confirm fix is back
```

Prefer doing the master-verification on a separate worktree if you can — it avoids this entirely.

### Anti-patterns (do not do these)

- ❌ Skipping reproduction because the entry "looks obvious." Reproduce. Always.
- ❌ Fixing multiple TODOs in one branch. One bug per branch, one branch per session.
- ❌ Pushing the branch (no `git push`). ph reviews and lands.
- ❌ Editing files outside the bug's blast radius. No "while-I'm-here" refactors.
- ❌ Marking `[✅]` without a corresponding `fix/...` branch + commit AND a regression test (or a documented reason there isn't one — hang bugs that can't be tested through the cclass framework are a valid reason).
- ❌ Committing on a red test suite. **Every suite you run must be green before `git commit`.** If something unrelated is broken, prove it pre-dates your change (re-run on master) and call it out — don't quietly commit through it.
- ❌ Silently skipping suites you didn't feel like running. List skipped suites in the commit message and journal with a reason.
- ❌ Leaving the bug-fix worker process running.
- ❌ Using port 9094 if ph's worker is on it. Check first; only start an alt-port worker if needed.
- ❌ Saving a `.cclass`/`.cpp`/`.hpp` file as UTF-8 — they're **windows-1252**. Saving as UTF-8 will silently corrupt umlauts/special chars and produce a giant whitespace/encoding diff. Edit byte-exact; if you must add Western-European characters, encode them as windows-1252.
- ❌ Auto-formatting the whole file (clang-format on save with formatOnSave). Only format the lines you touched, or skip clang-format entirely on macOS and let CI catch any nits.
- ❌ Converting tabs ↔ spaces, or LF ↔ CRLF — keep the file's existing convention.
- ❌ Running `bash runtime/build.sh` from `~/dev/awv/classcad` — cmake reads `CMakePresets.json` from cwd, so the build must be invoked from `~/dev/awv/classcad/runtime/`.
- ❌ Trusting the runbook's `--class <Suite> --func RunTestSuite` invocation. That path doesn't populate the suite and reports "No tests found". Use `UnitTesterHeadless.PerformTestSuite` instead.
- ❌ Rebuilding for a cclass-only change. `.cclass` files load at runtime; just restart the worker.
- ❌ Forgetting that `cclasses/` is a submodule. Run `git` commands from inside it for `.cclass` edits.
