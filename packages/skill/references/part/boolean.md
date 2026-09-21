# part.boolean

**Feature-level** boolean: unites, subtracts, or intersects solid features. Lives in the design tree, supports `updateBoolean`, and consumes its inputs.

## Key Parameters

- `id` — part ID (not feature or EIF ID)
- `target` — base feature ID, plain or `{id, indices}`. **Consumed**
- `tools` — feature IDs, plain `[id1, id2]` or `[{id: id1}, {id: id2, indices: [0]}]`. All **consumed**. No `keepTools` — to use a feature in several operations, create separate features
- `type` — `"UNION"` (default), `"SUBTRACTION"`, `"INTERSECTION"`
- `name` — defaults to `"Union"` / `"Subtraction"` / `"Intersection"` by type

## Return Value

A **new feature ID** — not the target ID (unlike `solid.*` booleans, which modify the target in place and return its ID).

## Consumption

After the boolean, target and tool IDs are invalid; reuse → error 1014 `"Entity \"...\" is not available. It has already been consumed/used in another operation."` Chain by using the returned ID as the next target (see Working Example: `bodyId` → `subId`).

## Differences from `solid.*` Booleans

| Behavior | `part.boolean` | `solid.union/subtraction/intersection` |
|---|---|---|
| Return value | New feature ID | Target solid ID (unchanged) |
| Input consumption | Target AND tools consumed | Only tools consumed (with `keepTools: false`) |
| Self-reference (target === tool) | **Succeeds safely** | **Error**: "requires distinct target and tool entities" |
| Empty tools `[]` | **Error** (code 1004) | Silent no-op |
| Non-overlapping bodies | **Succeeds silently** (all types) | SUB/INT can error (code 1014) |
| `keepTools` param | Not available | Available |
| Design tree | Creates a feature node | No feature tree |
| Updateable | Yes, via `updateBoolean` | No |

## Gotchas

- **Pattern targets are already consumed by the pattern.** `tools: [originalTool, patternOfIt]` fails with 1014 — pass `[patternId]` only (the pattern includes the original instance). The 1014 message **names the wrong entity** (another tool in the array or the pattern itself, e.g. "SetScrew2"/"Pat"), not the consumed one; with many tools, check for pattern-target overlaps before trusting the name.
- **⚠️ What stays parametric through consumption:**
  - Sketch-dimension edits (numeric `updateDimension` or live `@expr` bindings) on the tools' sketches **regenerate the boolean result exactly** — the always-safe parametric path.
  - **`circularPattern` with `merged: 1`**: `@expr`-bound count/angle stay fully live through the subtraction (tooth count 21→24 regenerated the subtracted body exactly). With `merged: 0` a consumed pattern does not regenerate correctly (count 4→6 reported success and left the target uncut) — **always merge patterns that feed booleans**.
  - `@expr`-bound params of consumed primitives regenerate correctly in a single subtraction (part.cylinder `diameter: '@expr.D'`, D 10→20: volume and hole position exact). One complex sprocket model with patterns and several booleans regenerated a consumed cylinder wrongly (hole moved, ¼ of the expected material change, maxLevel 31) — in long boolean chains, verify volume after parameter updates.
  - **Downstream edge-referenced features TRACK the regen**: a `part.chamfer` (tree tip) on the 1.0"-bore rims followed a sketch-dim regen to a 1.25" bore exactly (chamfer ring at the new radius, error 0 mm) — brep-id-based references survive sketch-driven topology regeneration.
- **A fully enclosed tool is fine — the result is one solid with a void.** Subtracting a tool that lies entirely inside the target (hollowing a closed body) gives ONE solid with two shells; the volume is exactly target − tool, and chamfer, union, further subtractions (including bores that open the void) and a slice straight through the void all work on it. STEP export keeps it as one solid with an outer and a reversed inner shell. No need to open the body first.
- **⚠️ A SUBTRACTION can succeed (maxLevel 31, new feature id) and return a SHEET body instead of a solid.** Seen on a multi-feature shell (sliced target with unioned bosses, sliced tool): the faces are cut correctly, so a section snapshot LOOKS right, but the shells are not assembled into a solid. Signature: `calculateMassProperties` reports the target's volume unchanged; a STEP export contains no solid; the next mass-properties call fails with `GetVolumeAndCOG: Division by zero!` and the next boolean with `The body used for Subtraction … is a Sheet, please select a solid`. It is geometry-dependent, not a rule about the operation: moving one unioned boss 0.5 mm, changing one unrelated chamfer by 0.8 mm, or slicing the target open before the subtraction each gave a correct solid from the same recipe. **After every subtraction assert the volume dropped by the tool's overlap** — an unchanged volume is a failed boolean, whatever maxLevel says; then perturb a dimension or reorder so the cut meets an open face.
- **Many tools in one call is fine** — one SUBTRACTION with 7 tools (pattern + revolves + cylinder + extrusions) works; one consumption chain beats sequential booleans for tool-heavy builds.
- **One root part per drawing.** A second `part.create` is refused ("There is already a root assembly or part"); `common.clear()` first, or use part templates in an assembly.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"Entity \"...\" is not available. It has already been consumed/used in another operation."` | 1014 | Reusing a consumed feature ID | Use the returned boolean feature ID |
| `"An element of parameter \"tools\" has an invalid id!"` | 1006 | Non-existent tool ID | Verify tool IDs |
| `"The provided part id does not exist."` | 1006 | Invalid `id` | Pass the correct part ID |
| `"The type \"0\" is not supported in PrepareAPIParams!"` | 1004 | Empty tools `[]` (an error, not a no-op) | Provide at least one tool |
| `"The body used for Subtraction (CC_Subtraction) is a Sheet, please select a solid."` | — | The TARGET is a sheet body left by an earlier boolean that reported success (see Gotchas) | Check the volume after each subtraction; fix the earlier one |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'BoolDemo' })).result
const plate = (await api.v1.part.box({ id: partId, name: 'Plate', length: 120, width: 80, height: 10 })).result
// Primitives take NO position params (unknown params silently ignored) — position via workCSys:
const riserCS = (await api.v1.part.workCSys({ id: partId, name: 'RiserCS', offset: [0, 10, 10] })).result
const riser = (await api.v1.part.box({ id: partId, name: 'Riser', length: 15, width: 60, height: 60, references: [riserCS] })).result

const bodyId = (await api.v1.part.boolean({ id: partId, type: 'UNION', name: 'Body', target: plate, tools: [riser] })).result

const holeCS = (await api.v1.part.workCSys({ id: partId, name: 'HoleCS', offset: [60, 40, -5] })).result
const hole = (await api.v1.part.cylinder({ id: partId, name: 'Hole', diameter: 10, height: 20, references: [holeCS] })).result
const subId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', name: 'WithHole', target: bodyId, tools: [hole] })).result
```

## Related

`part.updateBoolean` · `solid.union` / `solid.subtraction` / `solid.intersection` · `part.openFeature` / `part.closeFeature`
