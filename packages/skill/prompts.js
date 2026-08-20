// ─── Shared doctrine pointers ─────────────────────────────────────────────────
//
// Single source for the instruction text every agent host repeats: the buerli-ai
// system prompt and the ClassCAD MCP server instructions import these instead of
// maintaining copies (copies drifted — one drifted copy caused a production
// failure, 2026-08-19). Doctrine itself lives in recipes/verification.md and the
// other recipes; these strings are POINTERS plus the minimum framing. Hosts
// append their own tool mechanics (tool names, delegate/notes/ask syntax) — never
// doctrine.
//
// Keep these host-neutral: no backticked tool names, no host-specific verbs.

/** Which recipe to fetch for which task class — and that verification is always one of them. */
export const RECIPES_POINTER =
  'Sketch work needs "recipes/constrained-sketching"; multi-feature builds need the matching recipe — ' +
  '"recipes/parametric-part" (expressions + constraints + regeneration), "recipes/pattern-then-subtract" ' +
  '(N cutouts around an axis), "recipes/direct-modeling-eif" (programmatic one-shot construction) — and ' +
  'ALWAYS "recipes/verification": every build ends in verification, so it belongs in the SAME bulk fetch ' +
  'as the build docs. Recipes encode the composed workflow WITH its pitfalls — imitating them is faster ' +
  'and safer than composing from method docs.'

/** The reference-image discipline: recipes/verification Part I, start to final gate. */
export const REFERENCE_IMAGE_POINTER =
  '"recipes/verification" Part I governs from FIRST image exposure, before extracting dimensions or ' +
  'planning — fetch it and follow it to the letter: reference record first (handedness resolved by ' +
  'coincidence questions; one question per fresh reader where the host offers isolated readers; ' +
  'undecidables ASKED of the user, or DECLARED with the deciding channel when no user is reachable; ' +
  'record written down and frozen), then build, then the final gate — the A|B pair-sheet mirror check, ' +
  'UNCONDITIONAL for every image-referenced build and judged against the reference IMAGE, never against ' +
  'your own record. In-task handedness readings are measurably unreliable even when they feel certain; ' +
  'the readers, the record and the gate exist because of that.'
