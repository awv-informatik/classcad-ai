# part.boolean

Creates a boolean feature that combines, subtracts, or intersects solid features. This is the **feature-level** boolean — it lives in the design tree, supports `updateBoolean`, and consumes its input features.

## Prerequisites

- A part (`part.create`)
- At least two solid features (e.g., `part.box`, `part.cylinder`, etc.)

## Key Parameters

- `id` — part ID (not feature ID, not EIF ID)
- `target` — feature ID of the base solid. Can be a plain ID or `{id, indices}` object. **Consumed** after the operation.
- `tools` — array of feature IDs to apply. Can be plain IDs `[id1, id2]` or objects `[{id: id1}, {id: id2, indices: [0]}]`. All **consumed** after the operation.
- `type` — `"UNION"` (default), `"SUBTRACTION"`, or `"INTERSECTION"`
- `name` — optional custom name. Defaults to `"Union"`, `"Subtraction"`, or `"Intersection"` based on type.

## Return Value

Returns a **new feature ID** — not the target ID. This is fundamentally different from `solid.union/subtraction/intersection` which modify the target in place and return its ID.

## Consumption Behavior

**Both target and tool features are consumed.** After `part.boolean`, the original feature IDs are invalid. Any attempt to reuse them returns error code 1014: `"Entity \"...\" is not available. It has already been consumed/used in another operation."`

To chain booleans, use the **returned boolean feature ID** as the target for the next boolean:

```js
const unionId = (await api.v1.part.boolean({ id: partId, target: box1, tools: [box2] })).result
// box1 and box2 are now consumed — do NOT reference them
const subId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: unionId, tools: [cyl1] })).result
// unionId is now consumed — subId is the current feature
```

## Differences from `solid.*` Booleans

| Behavior | `part.boolean` | `solid.union/subtraction/intersection` |
|---|---|---|
| Return value | New feature ID | Target solid ID (unchanged) |
| Input consumption | Target AND tools consumed | Only tools consumed (with `keepTools: false`) |
| Self-reference (target === tool) | **Succeeds safely** | **Hangs server** (100% CPU) |
| Empty tools `[]` | **Error** (code 1004) | Silent no-op |
| Non-overlapping bodies | **Succeeds silently** (all types) | SUB/INT can error (code 1014) |
| `keepTools` param | Not available | Available |
| Design tree | Creates a feature node | No feature tree |
| Updateable | Yes, via `updateBoolean` | No |

## Gotchas

- **Features are consumed.** You cannot reuse target or tool IDs after the boolean. Track the returned feature ID.
- **`circularPattern`/`linearPattern` targets are already consumed by the pattern.** Tools like
  `[originalTool, patternOfIt]` fail with 1014 — pass `[patternId]` only (the pattern includes the
  original instance). The 1014 message **names the wrong entity** (some other tool in the array or
  the pattern itself, e.g. "SetScrew2"/"Pat"), not the consumed one — verified 2026-08-10. With many
  tools, check for pattern-target overlaps before trusting the named entity.
- **⚠️ Consumed tools are parametrically DEAD at the feature level — but ALIVE at the sketch level**
  (verified 2026-08-10, sprocket-parametric-B). After a boolean consumes tools:
  - sketch-dimension edits (numeric `updateDimension` or live `@expr` bindings) on the tools'
    sketches **regenerate the boolean result exactly** — this is the supported parametric path;
  - `@expr`-bound FEATURE params of consumed tools silently freeze (circularPattern count/angle)
    or CORRUPT the result (part.cylinder diameter: hole teleported, exactly ¼ of the expected
    material change, maxLevel 31 throughout);
  - explicit `openFeature`+`updateCircularPattern`+`closeFeature` on a consumed pattern reports
    full success and **changes nothing**.
  Design rule: route every parameter you want live through a sketch dimension; treat feature
  params (pattern count!) as frozen at consumption time — count changes require a rebuild.
  - **downstream edge-referenced features TRACK the regen**: a `part.chamfer` (tree tip) whose
    edge refs were collected on the 1.0"-bore rims followed a sketch-dim regen to a 1.25" bore
    exactly (chamfer ring at the new radius, error 0 mm; verified 2026-08-10) — brep-id-based
    references survive sketch-driven topology regeneration.
- **Many tools in one call is fine.** A single SUBTRACTION with 7 tools (pattern + revolves +
  cylinder + extrusions) works — one consumption chain beats sequential booleans for tool-heavy
  builds (verified 2026-08-10, sprocket generator).
- **Empty tools is an error**, not a no-op. Error: `"The type \"0\" is not supported in PrepareAPIParams!"` (code 1004).
- **Multiple `part.create` calls in one session** clear the drawing and can cause confusing `"id" must be provided"` errors. Use one `part.create` per cleared drawing.
- **No `keepTools` param.** Tools are always consumed. If you need a feature for multiple operations, create separate features for each.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"Entity \"...\" is not available. It has already been consumed/used in another operation."` | 1014 | Reusing a consumed feature ID | Use the returned boolean feature ID instead |
| `"An element of parameter \"tools\" has an invalid id!"` | 1006 | Non-existent tool feature ID | Verify tool IDs exist |
| `"The provided part id does not exist."` | 1006 | Invalid `id` (part ID) | Pass the correct part ID |
| `"The type \"0\" is not supported in PrepareAPIParams!"` | 1004 | Empty tools array `[]` | Provide at least one tool |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'BoolDemo' })).result

// Create features
const plate = (await api.v1.part.box({ id: partId, name: 'Plate', length: 120, width: 80, height: 10 })).result
const riser = (await api.v1.part.box({ id: partId, name: 'Riser', length: 15, width: 60, height: 60, translation: [0, 10, 10] })).result

// Union — returns new feature ID, plate and riser are consumed
const bodyId = (await api.v1.part.boolean({
  id: partId,
  type: 'UNION',
  name: 'Body',
  target: plate,
  tools: [riser],
})).result

// Subtract hole — bodyId is consumed, subId is the new feature
const hole = (await api.v1.part.cylinder({ id: partId, name: 'Hole', diameter: 10, height: 20, translation: [60, 40, -5] })).result
const subId = (await api.v1.part.boolean({
  id: partId,
  type: 'SUBTRACTION',
  name: 'WithHole',
  target: bodyId,
  tools: [hole],
})).result
```

## Related

- `part.updateBoolean` — modify type/name after creation (requires `openFeature`/`closeFeature`)
- `solid.union` / `solid.subtraction` / `solid.intersection` — direct-mode booleans (different behavior)
- `part.openFeature` / `part.closeFeature` — required gate for `updateBoolean`
