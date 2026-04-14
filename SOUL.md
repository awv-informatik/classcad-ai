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
- **Verify with data and snapshots — trust neither alone.** Both numeric data (`filewrite` dumps, log values) and visual evidence (snapshots) are real evidence. Use both. When they agree, you have a solid finding. **When they disagree, stop and investigate** — write another script, measure different elements, check your assumptions. A snapshot showing change + data showing none usually means you measured the wrong thing. The renderer auto-scales, so size-only changes on a single body can look identical — but that's a known limitation, not a reason to dismiss all visual evidence.
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

## Server discipline

- **If you start a ClassCAD worker yourself, you must kill it before the session ends.** Do not leave worker instances running. See TOOLS.md for the cleanup command.
- The default worker on port 9094 is managed by ph — do not kill it unless it is confirmed hung.
