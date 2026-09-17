# assembly.getWorkGeometry

Looks up a work geometry (plane, axis, csys, point) by name on an assembly instance. Returns the **template-scoped** ID — identical for every instance of the template, which is what constraint mates need.

Prerequisites: an instance of a part template containing work geometry with that name.

## Key Parameters

- `id` — required; instance ID (CC_ProductReference or CC_ProductReferenceET)
- `name` — required, exact and **case-sensitive** (`"Top"` works, `"top"` does not)

| ID type | Accepted? | Has work geometry? |
|---|---|---|
| Instance (CC_ProductReference) | Yes | Yes — from linked part template |
| ET instance (CC_ProductReferenceET) | Yes | Yes |
| Assembly root | Yes | Only the root's own `BaseWCSys` |
| Assembly template | Yes | **No** — always "Couldn't find" |
| Part template | **No** — wrong id type | Use `part.getWorkGeometry` |

## Return Value

Work geometry ID, maxLevel 31. Not found → null, maxLevel 51. Wrong ID type → maxLevel 51, code 1001.

## Built-in Names

Every part template has (same as `part.getWorkGeometry`): work planes `Top`, `Front`, `Right`; work axes `XAxis`, `YAxis`, `ZAxis`; `Origin` (a work point — rejected as a mate `csys`, see `assembly/fastened`).

## Gotchas

- **Sub-assembly instances have no work geometry.** For a nested part, get the ET instance IDs with `getInstance({ ownerId: subAsmInst })`, then call `getWorkGeometry` on the ET ID.

## Common Errors

| Error | Cause |
|---|---|
| `Couldn't find work geometry with name: "..."` | Name missing, wrong case, or ID is an assembly instead of an instance |
| `wrong id type! Provide only following id types: ["assembly","instance"]` | Part template ID — use `part.getWorkGeometry` or an instance |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })
const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'MatePoint', offset: [30, 20, 10] })).result
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst2' })).result

const wcs1 = (await api.v1.assembly.getWorkGeometry({ id: inst1, name: 'MatePoint' })).result
const wcs2 = (await api.v1.assembly.getWorkGeometry({ id: inst2, name: 'MatePoint' })).result
// wcs1 === wcs2 === wcsId

await api.v1.assembly.fastened({
  id: asmId, name: 'Attach',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
})
```

## Related

`part.getWorkGeometry` · `assembly.fastened` / `assembly.revolute` · `assembly.getInstance`
