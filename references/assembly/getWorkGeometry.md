# assembly.getWorkGeometry

Looks up a work geometry feature by name on an assembly instance. Returns the template-scoped ID of the matching work plane, axis, coordinate system, or point.

## Prerequisites

- An assembly with at least one instance of a part template
- The part template must contain work geometry with the target name

## Key Parameters

- **`id`** (required) — instance ID (CC_ProductReference or CC_ProductReferenceET). Also accepts assembly IDs, but assemblies have no work geometry so the lookup always fails.
- **`name`** (required) — exact name string, **case-sensitive**. `"Top"` works, `"top"` does not.

## Accepted ID Types

| ID type | Accepted? | Has work geometry? |
|---|---|---|
| Instance (CC_ProductReference) | Yes | Yes — from linked part template |
| ET instance (CC_ProductReferenceET) | Yes | Yes — same as above |
| Assembly root | Yes | **No** — always "Couldn't find" |
| Assembly template | Yes | **No** — always "Couldn't find" |
| Part template | **No** — wrong id type error | N/A |

**To look up work geometry on a part template directly**, use `part.getWorkGeometry` instead.

## Return Value

Returns the **template-scoped** work geometry ID. This is the same numeric ID regardless of which instance you query — two instances of the same template return identical IDs for the same work geometry name.

```js
{ result: id | null, messages?: [...], maxLevel?: real }
```

- Success: `maxLevel: 31`, result = work geometry ID
- Not found: `maxLevel: 51`, result = null
- Wrong ID type: `maxLevel: 51`, code 1001

## Built-in Names

Every part template has these built-in work geometries (same as `part.getWorkGeometry`):

| Type | Names |
|---|---|
| Work planes | `Top`, `Front`, `Right` |
| Work axes | `XAxis`, `YAxis`, `ZAxis` |
| Work CSys | `Origin` |

## Gotchas

- **Case-sensitive** — must match exactly.
- **Part template IDs rejected** — use `part.getWorkGeometry` for templates, `assembly.getWorkGeometry` for instances.
- **Returns template IDs, not instance IDs** — the returned ID is from the template scope, shared across all instances of that template. This is correct for constraint mate references.
- **Sub-assembly instances have no work geometry** — querying a sub-assembly instance for a part's work geometry fails. To access nested part work geometry, first get the ET instance ID via `getInstance({ ownerId: subAsmInst })`, then call `getWorkGeometry` on that ET ID.
- **Assembly roots have no work geometry** — the call is accepted but always returns "Couldn't find."

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `Couldn't find work geometry with name: "..."` | Name doesn't exist, wrong case, or ID is an assembly (not instance) | Check exact name with correct case; use an instance ID |
| `wrong id type! Provide only following id types: ["assembly","instance"]` | Passed a part template ID | Use `part.getWorkGeometry` for templates, or query an instance instead |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result

// Build geometry and a named WCS inside the template
await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })
const wcsId = (await api.v1.part.workCSys({
  id: tplId, name: 'MatePoint',
  origin: [30, 20, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

// Create instances
const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst2' })).result

// Look up work geometry by name on instances
const wcs1 = (await api.v1.assembly.getWorkGeometry({ id: inst1, name: 'MatePoint' })).result
const wcs2 = (await api.v1.assembly.getWorkGeometry({ id: inst2, name: 'MatePoint' })).result
// wcs1 === wcs2 === wcsId (all return the template-scoped ID)

// Use in a constraint
await api.v1.assembly.fastened({
  id: asmId,
  name: 'Attach',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
})
```

### Nested sub-assembly access

```js
// Sub-assembly instance doesn't expose nested part work geometry directly
const subAsmInst = /* ... instance of a sub-assembly ... */

// ❌ This fails — sub-assembly has no work geometry
await api.v1.assembly.getWorkGeometry({ id: subAsmInst, name: 'MatePoint' })

// ✅ Get the ET instance ID first, then look up
const etIds = (await api.v1.assembly.getInstance({ ownerId: subAsmInst })).result
const wcs = (await api.v1.assembly.getWorkGeometry({ id: etIds[0], name: 'MatePoint' })).result
```

## Related

- `part.getWorkGeometry` — same lookup but accepts part/instance IDs (use for template-level queries)
- `assembly.fastened` / `assembly.revolute` etc. — constraint APIs that consume the returned WCS IDs as mate references
- `assembly.getInstance` — needed to get ET instance IDs for nested sub-assembly access
