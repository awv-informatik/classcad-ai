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

0. **Forced-choice perception pass — FIRST, before everything else.**
   Measured fact (2026-08-18): the same model read a C-ring's opening
   direction wrong in 6/6 full CAD runs, but right in 3/3 when asked as an
   isolated question — task context collapses perception onto a gestalt and
   every later "evidence" confabulates around it. So: BEFORE inventorying
   dimensions or planning anything, glance at the reference only to spot the
   chirality-critical features (openings, notches, asymmetric bosses,
   handedness of ribs), then answer ONE BINARY IMAGE-SPACE QUESTION per
   feature, as if there were no task: "in image space, does the ring's gap
   face the lower-left (where the rib enters) or the upper-right?" — answer
   with pixel evidence (which edge, roughly where). Use a magnified crop of
   the critical region if one is available or obtainable (3/3 vs 2/3 in the
   measurement). These answers are FROZEN: the later holistic reading may
   add facts but may NOT overturn them — if it disagrees, that is a LOW
   CONFIDENCE conflict for the mirror check, not a revision.
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
   - **callout approach** — with an OPERATIONAL test, not a feeling: trace
     the leader from its text to the feature. Does it cross the part's
     silhouette/material on the way? A leader that reaches an INNER feature
     without crossing the surrounding ring's material tells you the gap is
     on its approach side. Answer per leader: "crosses material: yes/no".
   - **silhouette/edge continuity**,
   - **hidden/dashed lines**,
   - **symmetry** (which facts are even at mirror risk).
   Channel ranking: callout approach (with its crossing test) outranks
   everything; at low resolution (<~800 px) a silhouette impression is
   INADMISSIBLE as sole evidence for chirality. **Mechanical plausibility is
   a PRIOR, not evidence** — it describes typical parts, not this part
   (real parts DO have ribs meeting curved walls and cuts opening off the
   plate); use it only to break ties when every image channel is silent,
   never to override a callout reading. If your channels disagree, the fact
   is LOW CONFIDENCE: say so in the record, and the mirror check below is
   the decider.
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
   when one was LOW CONFIDENCE: FIRST, before rendering anything, write down
   the reference's answer in image-space terms ("in the REFERENCE image, the
   opening is on the upper-RIGHT of the tower"). Committing to it before
   seeing your renders prevents the renders from steering the reading. THEN
   render the matched view AND its mirror (negate the azimuth) and answer
   the same image-space question for each render independently. Pick which
   render matches the committed reference answer. Forced choice between two images is far
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
