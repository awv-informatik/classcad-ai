# TODO #5: `solid.subtraction` — consumed solid ID hang — NOT REPRODUCIBLE (re-classified)

**TODO entry:** #5 — "Referencing a consumed (keepTools=false) tool solid ID in any subsequent solid operation hangs the server."
**Original observation:** `2026-04-14_10-00-00_solidSubtraction` journal entry 08 (`scripts/08-keeptools-verify.mjs`).

## Outcome

**The hang does not reproduce on current `main`.** Every consumed-ID path I tried returns a clean
invalid-id error (code 1006, `maxLevel 51`) with the worker at 0% CPU — identical to referencing an
ID that never existed. No code fix was warranted. Per the runbook's golden rule (reproduce before
you fix; if it doesn't reproduce, journal + re-classify, don't fabricate a fix), this entry is
re-classified as **already-guarded / verified**, pinned with a regression test and a doc correction.

## What I tested (all against fresh `main` + rebuilt binary)

`scripts/01-repro.mjs` (env `CC_TEST` selects the follow-up op on a consumed tool id):

| Scenario | Result | CPU |
|---|---|---|
| Baseline: never-existed id `999999` as tool | code 1006 "...invalid id!" | 0% |
| Consumed tool reused as a **tool** | code 1006 "...invalid id!" | 0% |
| Consumed tool reused as the **target** | code 1006 "...invalid id!" | 0% |
| Consumed id in **solid.translation** | code 1006 "...invalid id!" | 0% |
| Consumed id in **solid.copy** | code 1006 "...invalid id!" | 0% |

Each error is preceded by a WARNING `"ToId()/TOID() didn't get an existing or valid id."` — i.e. the
shared id resolution / type check in `AbstractAPI.PrepareAPIParams` rejects a consumed id up front,
before it can reach the kernel.

## The original repro also used wrong parameter names

`2026-04-14_.../scripts/08-keeptools-verify.mjs` calls:

```js
api.v1.solid.translation({ id: eifId, solid: cyl, direction: [10, 0, 0] })
```

`solid.translation` takes `target` and `translation` — not `solid`/`direction`. So that script's
"hang" was on a call with a **missing required `target`** *and* a consumed id. Re-running the exact
original script on current main (mandatory rerun, `files/original-journal-rerun.log`): it returns
`code 1004 "The parameter \"target\" must be provided..."`, no hang, 0% CPU. So whatever the April
build did, the malformed-param and consumed-id paths are both cleanly guarded now.

## Why it no longer reproduces (best attribution, not certain)

The clean rejection comes from the API id-type validation (`TOID` + `idTypes: ["CC_Solid"]` in
`AbstractAPI.PrepareAPIParams`). A consumed solid is removed from the database by the boolean
(`RemoveObject`), so its id no longer resolves to a live `CC_Solid` and the check rejects it exactly
like a nonexistent id. The git dates around the relevant validation PRs are inconsistent with the
April observation (they appear to predate it), so I did not pin a single "fixed-in" commit — the
behavioral verification above is the evidence, not archaeology.

## Deliverables — published-doc correction only (per the not-reproducible policy)

Per the not-reproducible policy (TODO-HOW-TO.md step 4): when a crash/error can't be confirmed,
don't manufacture a regression test or touch product code (`runtime`/`cclasses`) — but DO correct
the published `classcad-skill` docs if they state the unconfirmed crash as fact.

- **No product-code change**, **no regression test.** (I briefly trialed a `cclasses` regression
  test, then removed it per policy — a test for a non-bug is noise.)
- **Skill doc correction** — `classcad-skill` branch `docs/solid-consumed-id-clean-error`: the
  "consumed id hangs the server / kill -9 / infinite loop" wording in `solid/subtraction.md`,
  `solid/intersection.md`, and `solid/target-tools-pattern.md` replaced with the verified current
  behavior (clean code-1006 error). `translation.md`/`scale.md`/`rotation.md`/`mirror.md` already
  documented the clean 1006 error and were left as-is. Re-grepped the whole `references/` tree to
  catch every repetition of the stale claim (`target-tools-pattern.md` was an easy one to miss).

## Verification artifacts (kept)

Repro scripts + outputs in `files/` (`01-repro-repro-*.json` for each variant, `original-journal-rerun.log`).
These are evidence the entry doesn't reproduce; they live in the training folder, not in any product repo.
