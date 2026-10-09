// ─── Shared doctrine pointers ─────────────────────────────────────────────────
//
// Single source for the instruction text every agent host repeats: the buerli-ai
// system prompt and the ClassCAD MCP server instructions import these instead of
// maintaining copies (copies drifted — one drifted copy caused a production
// failure). Doctrine itself lives in recipes/verification.md and the
// other recipes; these strings are POINTERS plus the minimum framing. Hosts
// append their own tool mechanics (tool names, delegate/notes/ask syntax) — never
// doctrine.
//
// Keep these host-neutral: no backticked tool names, no host-specific verbs.

/** Which recipe to fetch for which task class — and that verification is always one of them. */
export const RECIPES_POINTER =
  'Pick the build recipe by the INPUT, not the verb: reproducing DIMENSIONED geometry — a technical ' +
  'drawing, a fetched or attached drawing image, a spec with values, whatever the part type — is ' +
  '"recipes/constrained-sketching" territory (dimension checklist → constraints + dimensions; the solver ' +
  'lays out the sketch). A hardcoded coordinate layout is dead geometry: it passes shape checks and cannot ' +
  'regenerate. "recipes/parametric-part" adds expressions + regeneration across features; ' +
  '"recipes/assembly-parameters" covers values shared by several parts of an assembly (assemblies host no ' +
  'expressions — parameter part, refresh, constraints that follow parameters); ' +
  '"recipes/pattern-then-subtract" covers N cutouts around an axis; "recipes/direct-modeling-eif" is for ' +
  'one-shot solids WITHOUT a dimensioned reference — never for drawing reproduction; "recipes/buerli-app" ' +
  'turns a model into the user\'s own web app. ALWAYS include ' +
  '"recipes/verification": every build ends in verification, so it belongs in the SAME bulk fetch as the ' +
  'build docs. Recipes encode the composed workflow WITH its pitfalls — imitating them is faster and safer ' +
  'than composing from method docs.'

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
