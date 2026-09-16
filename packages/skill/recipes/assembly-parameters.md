# Recipe: Shared parameters across the parts of an assembly

Several parts in an assembly follow one set of values ("global width", "overall height",
a shared bolt size) and stay parametric: change the value once, every part regenerates
and constrained instances move with it.

## The one fact to know first

**Only parts host expressions.** Every part (including a part template) owns one
`ExpressionSet`. Assemblies have none: `part.expression({ id: assemblyId, ... })` is
rejected with `wrong id type ... ["part"]`, and there is no `assembly.*` expression API.

Shared values therefore live in a **parameter part**: a part template that holds only
expressions. Other parts read it by object path.

## 1. Build

```js
const asm = (await api.v1.assembly.create({ name: 'Root' })).result

// Parameter part — expressions only, no geometry, no instance needed
const Params = (await api.v1.assembly.partTemplate({ name: 'Params' })).result
await api.v1.part.expression({ id: Params, toCreate: [{ name: 'W', value: 40 }] })

// Consuming part A: mirror the shared value into a local expression, bind features to it
const A = (await api.v1.assembly.partTemplate({ name: 'A' })).result
await api.v1.part.expression({ id: A, toCreate: [{ name: 'W', value: 'Params.ExpressionSet.W' }] })
await api.v1.part.box({ id: A, length: 20, width: 20, height: '@expr.W' })

// Consuming part B: derived values are ordinary formulas on the local mirror
const B = (await api.v1.assembly.partTemplate({ name: 'B' })).result
await api.v1.part.expression({ id: B, toCreate: [
  { name: 'W', value: 'Params.ExpressionSet.W' },
  { name: 'D', value: 'W / 2' },
] })
await api.v1.part.cylinder({ id: B, diameter: '@expr.D', height: '@expr.W' })

await api.v1.assembly.setCurrentProduct({ id: asm })
const iA = (await api.v1.assembly.instance({ productId: A, ownerId: asm, name: 'A1' })).result
const iB = (await api.v1.assembly.instance({ productId: B, ownerId: asm, name: 'B1',
  transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
```

- `Params.ExpressionSet.W` is an **object path**: `<part template name>.ExpressionSet.<expression>`.
- Feature parameters only take `@expr.<local name>`, so each consuming part mirrors the
  shared value into a local expression and binds its features to that.
- Always use the `toCreate` / `toUpdate` array forms — the bare `{ id, name, value }` form
  returns result=1 and does nothing.
- The path is stored as formula text and survives OFB save/load.

## 2. Change the shared value

```js
// 1. Change the value in the parameter part
await api.v1.part.updateExpression({ id: Params, toUpdate: [{ name: 'W', value: 60 }] })

// 2. Refresh EVERY consuming part by re-assigning its mirror expression (same formula)
for (const part of [A, B]) {
  await api.v1.part.updateExpression({ id: part, toUpdate: [{ name: 'W', value: 'Params.ExpressionSet.W' }] })
}
// Geometry, work csys, constrained instance placement and root mass properties are now current
```

Why step 2 is needed:

- **`updateExpression` works per part.** It re-evaluates the given part's `ExpressionSet`
  and regenerates that part's features. Cross-part paths are not tracked as dependencies,
  so `A` and `B` are not notified when `Params` changes.
- **Re-assigning the same formula is a refresh.** It re-reads `Params.ExpressionSet.W`,
  regenerates the part and — like every `part.updateExpression` — then solves all
  assemblies that contain the part. That solve is what moves constrained instances.
- **Updating `Params` alone solves nothing**: `Params` has no instance, so no assembly
  contains it.

### Alternative: `common.recalc()`

`recalc()` re-evaluates and regenerates every part, so consumers pick up the new value
without being listed. Two differences:

- **`recalc()` does not run the constraint solver.** Instances constrained to geometry that
  moved keep their previous placement. Follow it with a re-assign in one consuming part
  that is instanced in the assembly (or an update on the affected constraint).
- **One pass per reference level.** If part C reads `B.ExpressionSet.W` which reads
  `Params`, the first `recalc()` updates B's geometry and a second one updates C's.

## 3. Constraints that follow parameters

Assembly constraints mount instances by their **work coordinate systems**: mate2's csys is
placed on mate1's csys (origin on origin, axes on axes); offsets are measured along mate1's
csys axes. To make a mounting point follow a parameter, drive the csys with an expression:

```js
// On top of A: csys offset follows A's local W
const top = (await api.v1.part.workCSys({ id: A, name: 'Top', offset: '[0, 0, @expr.W]' })).result
const base = (await api.v1.part.workCSys({ id: B, name: 'Base' })).result   // at B's origin
const aBase = (await api.v1.part.workCSys({ id: A, name: 'Base' })).result
await api.v1.assembly.fastenedOrigin({ id: asm, mate1: { path: [iA], csys: aBase } })
await api.v1.assembly.fastened({ id: asm, mate1: { path: [iA], csys: top }, mate2: { path: [iB], csys: base } })
```

- Build csys with `part.workCSys({ offset, rotation })`. `origin`/`xDirection`/`yDirection`
  are not parameters and are ignored (csys stays at the part origin).
- Expressions in vectors go in ONE string: `'[0, 0, @expr.W]'`. `[0, 0, '@expr.W']` fails.
- Constraints need an explicit `part.workCSys`; the built-in `Origin` is rejected.
- The refresh sequence in section 2 also re-solves these constraints.
- Details per constraint type: `v1.assembly.fastened`, `v1.assembly.revolute`, … notes.

## 4. Verify

```js
const t = await api.tree({ refresh: true })                      // await — returns a Promise
const placeB = t[iB].coordinateSystem                             // [origin, xDir, yDir, zDir]
const vol = (await api.v1.assembly.calculateMassProperties({ id: asm })).result.volume
const wB = (await api.v1.part.getExpression({ id: B, name: 'W' })).result.value
```

- Check the mirrored value in each consumer (`getExpression`), total volume on the **root
  assembly**, and instance placement from `coordinateSystem` — before and after a change.
- Do not measure individual instances (`calculateMassProperties({ id: instanceId })`): that
  materializes all instances of the template and they stop following template changes.
- Full verification discipline: `recipes/verification`.

## Guidelines

- **Reference the parameter part directly** from every consumer. If consumers reference
  each other, refresh them in dependency order.
- **Keep the parameter part's name fixed.** After renaming `Params`, consumers report
  `Datamember ... not found` on evaluation.
- **Consumers resolve the path inside the drawing that contains `Params`.** A consuming
  part exported or loaded on its own leaves the path unresolved.
- Verified scope: part templates in one root assembly, several instances per template,
  fastened and other csys-mounted constraints.

## Related

`v1.part.expression` · `v1.part.updateExpression` · `v1.assembly.partTemplate` ·
`v1.assembly.instance` · `v1.assembly.fastened` · `v1.common.recalc` ·
[part/expression-workflow](../references/part/expression-workflow.md) (single-part expressions) ·
[assembly/generic](../references/assembly/generic.md) (templates, instances, when the solver runs)
