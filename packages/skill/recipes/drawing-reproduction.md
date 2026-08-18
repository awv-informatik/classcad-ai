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
3. **Chirality facts get a TWO-HYPOTHESIS adjudication** — first impressions
   mirror. For every handedness/side/direction fact, write BOTH readings
   (e.g. "C opens toward the rounded end" vs "C opens away from it") and
   score each against the independent evidence channels:
   - **callout approach** (which side does the leader enter from — leaders
     come from open space),
   - **silhouette/edge continuity**,
   - **hidden/dashed lines**,
   - **mechanical function** (ribs land on flat faces, cuts open toward
     reachable sides),
   - **symmetry** (which facts are even at mirror risk).
   Channel ranking: at low resolution (<~800 px) a silhouette impression is
   INADMISSIBLE as sole evidence for chirality — callout approach and
   mechanical function outrank it. If your channels disagree, the fact is
   LOW CONFIDENCE: say so in the record, and see the mirror check below.
4. **Ambiguity is spoken, never swallowed**: if two readings survive, state
   the ambiguity. Interactive host → ask the user ONE confirmation question
   ("the C opens away from the rounded end — correct?"); one answer beats any
   heuristic. Headless → pick the higher-ranked channel and SAY which channel
   decided.

## Build

Implement the record (verify-numerically discipline per stage). The record is
frozen — if mid-build evidence contradicts it, stop and re-derive the record
from the reference, don't patch silently.

## Final gate — four steps, in order

1. **Matched-view renders**: one snapshot per reference view, oriented like
   the reference (snapshot supports named views AND `{azimuth, elevation}` —
   match the iso's octant; front/top/right for orthographic views). A
   comparison against an arbitrary ISO is not a comparison.
2. **Mirror check (forced choice)** — for every chirality fact, and always
   when one was LOW CONFIDENCE: render the matched view AND its mirror
   (negate the azimuth). The mirrored camera shows what the mirrored part
   would look like from the reference's viewpoint. Now answer three
   IMAGE-SPACE questions independently: "in the REFERENCE, which image side
   is the opening/asymmetric feature on?" — "in render A?" — "in render B?"
   Then pick which render matches. Forced choice between two images is far
   more reliable than judging handedness in one. If the MIRROR matches, your
   reading is flipped: fix the model, don't re-argue the record.
3. **Record replay, numerically**: walk the reference record row by row and
   prove each orientation fact with a probe — material-presence at a test
   point, extents asymmetry, face position (see verify-numerically). A fact
   you can probe beats a fact you can eyeball.
4. **Second reading**: with the build done, re-derive the chirality facts
   FROM THE REFERENCE IMAGE AGAIN — fresh, not from memory of your record —
   and diff against the record. Any difference between render and reference
   is EXPLAINED BY A MEASUREMENT or it is a defect: "different viewing
   angle" is never an explanation — it is the rationalization that ships
   mirrored parts.

## Related

[recipes/verify-numerically](verify-numerically.md) ·
[recipes/constrained-sketching](constrained-sketching.md) ·
[recipes/parametric-part](parametric-part.md)
