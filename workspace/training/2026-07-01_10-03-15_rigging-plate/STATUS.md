# Rigging plate — PAUSED (resume later)

Integration study: reproduce the anchor/rigging-plate technical drawing via the circles-and-trim methodology
(region-predicate trim from SKETCHING.md). Paused 2026-07-01 partway; topology correct, fillets/proportions unfinished.

## Where it stands
- Method validated on a complex multi-feature part: draw all bosses/lobes/holes/fillet-disks as full shapes, then
  `preTrim → classifyByRegion(inAnyBody ∧ ¬inAnyHole ∧ ¬inAnyFillet) → trim → postTrim` extracts the whole wire
  (outer outline + every hole loop) in ONE pass. See `06-plate.mjs` (latest) and `05-union2.mjs` (clean union).
- Best render so far: `files/06-plate-06-after-sketch-S.png` (topology right), `files/05-union2-05-after…png`.

## Key correction from the user (important — was wrong before)
- The **`.750`** dimension = **horizontal** center-to-center distance between the **top boss (Ø1.625)** and the
  **center boss (Ø1.750)**. The two boss circles keep a **clear gap** (do NOT overlap) — they're joined by a **web**.
  Geometric consequence: with only 0.750 horizontal offset, a clear gap (center dist > r1+r2 = 1.6875) forces a
  large **vertical** offset (Δy ≳ 1.5) → the top boss sits well ABOVE the center boss. Model now has
  topBoss `[2.20, 2.60]`, centerBoss `[2.95, 0.95]`, plus a `web` capsule bridging them (`_model.mjs`).
- Earlier attempts had the bosses ~0.90 apart and heavily overlapping — "too close." Fixed.

## Remaining work (open)
1. **Retarget the waist fillets** for the raised top boss — moving it broke both: `topWaist` R1.750 now fires too
   high (center `[4.29,4.09]`), and `botWaist` leaves the center-boss bottom poking below. Re-pick which valleys
   R1.750 / R1.375 blend (was going to confirm with user: R1.750 = top-boss↔left-end vs top-boss/web↔right-lobe).
2. **Left-end connection** — after pulling `leftEnd.b` back to clear the center hole, it barely connects; needs a
   web or overlap tuned.
3. **Right-lobe neck** — add the 2×R.625 / 2×R.438 blends (earlier attempt tangent to the far center boss
   over-pinched; target the actual neck).
4. **Verify holes** stay whole (center hole was getting split by the left-end circle overlap).
5. **Open calibration Qs for the user:** (a) top-boss vertical height — as-is (tall plate) vs level with the right
   lobe? (b) exact R1.750 valley. (c) datum for the 2.312 / 5.804 horizontal chain to nail x-positions.

## Toolkit added this session (reusable, in scripts/)
- `_geo.mjs`: `segDist` + `inCapsule` (+ `contains` capsule support); classifiers now skip unqueryable
  (maxLevel>31) segments instead of crashing.
- `_setup.mjs`: `obround(a,b,r)` (2 circles + 2 tangent lines) and `cleanupSlivers` (drop short LINES + orphan
  center-points; never deletes arcs — a near-full arc has a tiny chord).
- `_model.mjs`: parametric model + `filletCenter`/`filletDisks` (external-tangency concave fillet disks).

See `ANALYSIS.md` for the full dimension checklist.
