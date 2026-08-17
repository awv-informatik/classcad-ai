# preTrim hang — repro attempt (TODO.md #174)

**Incident (2026-08-17, e2e mcp benchmark #1):** whole-sketch
`v1.sketch.preTrim({ id })` on a fully constrained sprocket tooth-space sketch
never returned. The native worker (`classcad-cli`, arm64-osx release) spun at
99–100% CPU with runaway RSS (~470 MB → 2.9 GB) for ~45 minutes and then the
process died, killing every session on it. Full incident narrative:
`workspace/e2e/journal.md` history #22.

**Status: NOT yet reproducible in isolation.** `repro.mjs` replays the exact
command sequence extracted from the incident transcript (identical solved
coordinates to 1e-15, same constraint/dimension scheme, same blank pre-state).
Six runs against a fresh disposable worker all returned normally
(`maxLevel 31`, 6 split curves) — including four back-to-back runs against the
same worker instance.

**Working hypothesis:** the hang is *worker-state-dependent*, not
sketch-shape-dependent — the incident worker had ~7 h uptime and a long mixed
session history (several 20–45 min benchmark builds). Candidates: heap
fragmentation / leak pressure, or leftover per-session state. Next time a
worker wedges in preTrim, grab a `sample <pid>` profile BEFORE killing it
(that's how #173's underflow was found).

## Run it

```bash
# disposable worker on 9096 (do NOT use the shared :9094 worker)
cd ~/dev/awv/classcad && ./runtime/output/arm64-osx-clang/release/classcad-cli worker -i .classcad-alt.ini &

cd ~/dev/awv/classcad-ai
node scripts/run.mjs workspace/repro/2026-08-17-pretrim-hang/repro.mjs \
  --outdir /tmp/pretrim-out --port 9096
```

Expected on a healthy engine: `preTrim outcome: { outcome: 'returned', maxLevel: 31, splits: 6 }`.
On an affected worker the script prints the 60 s race timeout and the worker
pins a core.

Note: `.classcad-alt.ini` is a copy of `.classcad.ini` with ports 9096/9097
(the TOOLS.md mention of it predates its deletion; recreate via
`sed -e '33s/9094/9096/' -e '34s/9094/9096/' -e '41s/9095/9097/' -e '42s/9095/9097/' .classcad.ini > .classcad-alt.ini`).

## Workaround (proven, and simply better)

Skip trim entirely for known-topology profiles: build the closed constraint
chain (seat ARC via `arcByCenter` + TANGENT/COINCIDENT junctions) as
SKETCHING's "Chain vs trim" rule recommends. That is how the root-agent GT,
the mcp agent's rebuild, and the recipes construct the tooth space.
