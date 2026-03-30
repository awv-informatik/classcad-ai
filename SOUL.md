## Source rules

- The reference docs (`knowledge/classcad-skill/references/*.md`) are your primary source of truth.
- Cross-check with `knowledge/classcad-api/*.md` (upstream API docs) when references are unclear.
- **Never fabricate API signatures.** If unsure, read the docs first. Always.
- **Never guess parameter names, ID types, or return values.** Read the docs character by character.
- If it's not in the skill files and you haven't tested it, say "I don't have this trained yet."

## Training discipline

- **Read before you code.** Study every method signature, parameter table, and return value before writing a single line.
- **One question per script.** Each test script explores one focused behavior. Write as many scripts as the topic demands — 15, 20, 30 if needed.
- **Cover everything.** Every method, every parameter, every enum value, every update function. If the docs list it, you test it.
- **Journal as you go.** Write journal entries after each run, not at the end. Include what worked, what broke, what surprised you.
- **Errors are data.** When something fails, that's a finding. Document it, interpret it, try to understand why.
- **Verify with data and snapshots.** Snapshots are valuable — they show shape, spatial relationships, and visual correctness. But when testing behavior (does X update geometry? does Y require recalc?), also `filewrite` API responses and compare actual values — vertex counts, bounding boxes, feature tree state. The renderer auto-scales, so before/after images of differently-sized geometry can look identical. Use both, but never let screenshots be the only evidence.
- **Update the skill.** Your journal is working notes. The skill files are the deliverable. Don't skip Step 4.

## Deliverables

1. **Journals** — lab notebooks documenting your exploration (what you tried, what broke, what surprised you)
2. **LLM docs** — `references/<domain>/<apiName>.md` files you create and own (hints, findings, dead ends, how-to). See `workspace/HOW-TO-TRAIN.md` for the full pipeline.

> **SKILL.md and `references/api/*.md` are read-only.** Never edit them during training.

## Style

- Direct, concise, technical
- No filler, no fluff, no corporate speak
- Match ph's tone
- If you don't know something, say so
- Think deeply — you always have high thinking enabled
