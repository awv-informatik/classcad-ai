# Step 1–2 — Rigging plate: dimension checklist & shape decomposition

Source: technical drawing of a rigging/anchor plate. Units: **inches** (values like 5.804, R.437 ⇒ inch).
Convention here: y-up, origin at the plate's lower-left, x to the right.

## Dimension checklist (every annotation)

- [ ] D1  Ø.750   — DIAMETER — top-boss through-hole (r 0.375)
- [ ] D2  Ø1.625  — DIAMETER — top boss outer (r 0.8125)
- [ ] D3  Ø1.125  — DIAMETER — center-boss through-hole (r 0.5625)
- [ ] D4  Ø1.750  — DIAMETER — center boss outer (r 0.875)
- [ ] D5  .750    — HORIZONTAL — offset at the very top (top-boss region → right-lobe blend)
- [ ] D6  R1.750  — RADIUS — large upper body fillet (concave waist, top)
- [ ] D7  R1.375  — RADIUS — large lower body fillet (concave waist, bottom)
- [ ] D8  2× R.750 — RADIUS — left-end outer rounded corners (top-left, bottom-left)
- [ ] D9  2× R.437 — RADIUS — left SLOT rounded ends (obround hole)
- [ ] D10 1.000   — HORIZONTAL — left slot end-to-end (center distance)
- [ ] D11 1.875   — VERTICAL — left-end outer height
- [ ] D12 2× R.625 — RADIUS — upper fillets, right lobe → body
- [ ] D13 2× R.438 — RADIUS — lower fillets, right lobe → body
- [ ] D14 2× R.875 — RADIUS — right lobe rounded end (obround, the far lobe)
- [ ] D15 40°     — ANGLE — right lobe axis from horizontal
- [ ] D16 2.312   — HORIZONTAL — center-boss center → right-lobe reference
- [ ] D17 5.804   — HORIZONTAL — overall width

## Shape decomposition (place full shapes, then trim)

Primary filled lobes/bosses (union → body):
- **Left lobe**: rounded body around the slot. Outer corners R.750 (D8), height 1.875 (D11).
- **Top boss**: circle r 0.8125 (D2).
- **Center boss**: circle r 0.875 (D4) — main datum.
- **Right lobe**: obround, two r 0.875 arcs (D14) on a 40° axis (D15).

Concave waist fillets (carve the body between lobes):
- R1.750 (D6) top waist, R1.375 (D7) bottom waist, R.625 (D12) & R.438 (D13) at the right-lobe junctions.

Interior holes (kept loops, subtract from body):
- Top hole r 0.375 (D1), center hole r 0.5625 (D3), left slot obround (D9/D10).

## v1 coordinate model (rough seeds — snapshot will calibrate)

Center boss is the datum. From D16 (2.312) and D17 (5.804):
- centerBoss  c=[2.95, 0.95]  rBoss 0.875  hole 0.5625
- topBoss     c=[2.05, 1.80]  rBoss 0.8125 hole 0.375
- slot ends   [0.60,0.95] & [1.60,0.95]  rEnd 0.437 (1.000 apart)
- rightLobe   far end c≈[4.95,1.55] rEnd 0.875 (40° axis; second end nearer body)

The fillet-circle centers are NOT hand-placed — seed rough on the correct side and let TANGENT+RADIUS solve them.

## Realization strategy (single run)

Per SKETCHING.md + the trim toolkit, ONE run does the whole part:
1. place lobes/bosses/holes/slot + fillet circles (rough seeds),
2. FIXATION datum + TANGENT/RADIUS/DIMENSION → solver lays out exact tangencies,
3. read back solved centers/radii,
4. region predicate `inAnyLobe ∧ ¬inAnyFilletDisk ∧ ¬inAnyHole`,
5. preTrim → classifyByRegion → trim → postTrim,
6. before/after snapshots; iterate on seeds/side until silhouette matches.

Staged for de-risking: 01 = primary-circle silhouette calibration (no fillets/trim) first.
