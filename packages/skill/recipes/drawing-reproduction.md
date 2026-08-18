# Recipe — reproducing a reference (drawing, image, existing part)

When the task includes an INPUT REFERENCE, correctness has two halves:
**execution** (the model matches your plan — covered by
[verify-numerically](verify-numerically.md)) and **interpretation** (your plan
matches the reference). Green numbers cannot save a mirrored reading: three
independent runs built the same part with a C-cut facing the wrong way, each
with a full suite of passing probes — because every probe target was derived
from the same misread image. This recipe gates the interpretation half.

## Match the tests to the task context

- **Text-only spec** (numbers in the prompt): no perception phase — go
  straight to verify-numerically discipline.
- **Dynamic/iterative prompts** (the user steers as you go): verify each
  increment numerically; re-confirm orientation facts whenever the user's
  wording implies a side, direction, or handedness.
- **Input reference (image/drawing/part)**: EVERYTHING below is mandatory.

## Phase 0 — the REFERENCE RECORD (before any modeling)

Write the record down (notes tool / your plan) BEFORE the first build call.
It is the contract the final verification tests against.

1. **Inventory**: which views does the reference show (iso, front, top, …)?
   What resolution is the image? Below ~800 px, fine features — especially
   chirality — are LOW CONFIDENCE: say so in the record.
2. **Callout anchors** — the strongest spatial evidence in a drawing. For
   every dimension callout, write what its leader/arrows physically TOUCH:
   "Ø30 leader enters from the upper right and lands on the inner arc",
   "R30 touches the outer arc on the side facing the rounded end". Leaders
   point at real geometry; silhouette impressions can lie, callouts rarely do.
3. **Orientation facts, landmark-relative, chirality explicit**: one line per
   fact, each naming TWO features and their relation — "the C-opening faces
   AWAY from the rounded base end", "the rib meets a FLAT vertical face on
   the tower's inboard side", "the tower's curved wall faces the viewer in
   the iso". Note the evidence for each line (callout, visible edge, hidden
   line, shading).
4. **Cross-checks**: mechanical plausibility (ribs land on flat faces, bosses
   sit concentric to their bores, cuts open toward reachable sides) and
   inter-view consistency. If two readings survive the cross-checks, DO NOT
   pick silently: state the ambiguity, and in an interactive host ask the
   user ONE confirmation question ("the C opens away from the rounded end —
   correct?"). One answer beats any heuristic.

## Build

Implement the record (verify-numerically discipline per stage). The record is
frozen — if mid-build evidence contradicts it, stop and re-derive the record
from the reference, don't patch silently.

## Final gate — three steps, in order

1. **Matched-view renders**: one snapshot per reference view, oriented like
   the reference (snapshot supports named views AND `{azimuth, elevation}` —
   match the iso's octant; front/top/right for orthographic views). A
   comparison against an arbitrary ISO is not a comparison.
2. **Record replay, numerically**: walk the reference record row by row and
   prove each orientation fact with a probe — material-presence at a test
   point, extents asymmetry, face position (see verify-numerically). A fact
   you can probe beats a fact you can eyeball.
3. **Second reading**: with the build done, re-derive the chirality facts
   FROM THE REFERENCE IMAGE AGAIN — fresh, not from memory of your record —
   and diff against the record. Fresh eyes after building catch misreads the
   first pass locked in. Any difference between render and reference is
   EXPLAINED BY A MEASUREMENT or it is a defect: "different viewing angle"
   is never an explanation — it is the rationalization that ships mirrored
   parts.

## Related

[recipes/verify-numerically](verify-numerically.md) ·
[recipes/constrained-sketching](constrained-sketching.md) ·
[recipes/parametric-part](parametric-part.md)
