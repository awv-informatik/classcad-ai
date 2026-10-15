# Recipe: Clean construction — one template per shape, one feature per operation (parts and assembly models without clutter, duplication or feature creep)

A model is clean when every object in its tree carries design intent: one template per distinct
shape, one feature per manufacturing operation, design values as named expressions, the world
position in the instance transform, structure in sub-assemblies, joints only where something
moves. This recipe is the construction discipline for every multi-feature part and every
assembly — new builds, vendor/purchased parts, models traced or converted from STEP — and the
procedure to clean up, tidy, refactor or sanitize a messy, bloated or redundant model that grew
without it.

Measured on a real case: an agent rebuilt a 251-instance FRC shooter assembly from a STEP file;
the same assembly was then rebuilt clean. The audit below, run on both:

| | Agent build | Clean rebuild |
|---|---|---|
| Part templates | 152 (one per STEP definition) | 75 (one per distinct shape) + a frame reference |
| Instances | 251, flat | 165 leaf instances, 2 sub-assemblies |
| Imported bodies | 73 (4 invalid; one loaded as a sheet, volume −65.9) | 0 |
| Expressions | 3748: 3314 vertex coordinates (`Stock_outline_P1X`), 43 scale factors of 1 | 559 design values (`TapD`, `BoltCircleR`, `HexAF`) |
| Work geometry beyond the defaults | 951, of which 779 `Mate_*` | 145, of which 12 joint frames |
| Assembly constraints | 251 (245 fastened, restating the placement) | 27, all motion: 1 ground, 10 revolutes, 10 rigid groups, 6 gear relations |
| Main side plate | 11 sketches, 21 features | 1 sketch, 1 extrusion |
| Audit findings | 10 rules, 406 hits | 4 hits (3 sliver-face parts, 1 part off its origin) |

## The rules

1. **One template per distinct shape**, instanced as often as it occurs. Three identical screws are
   one template and three instances, never three templates.
2. **Design frame per part.** Model each part at its own origin: axis on Z, mounting face at
   z = 0, symmetric features on the axes. The world position belongs to the instance
   transform — never to sketch-plane offsets or coordinates inside the part.
3. **Expressions are design values** — bore, wall, bolt circle, hole count, across-flats: what a
   designer would change. A vertex coordinate is not a parameter; a scale factor of 1 is noise.
4. **One shape, one sketch.** An outline and all its holes and pockets are loops of ONE sketch,
   extruded by ONE feature (nested loops subtract). Never a base sketch plus one sketch per
   cutout at the same depth.
5. **One feature per manufacturing step**: turned part = one dimensioned half-section, one
   revolve; N equal holes, slots or tooth spaces = one seed, one merged pattern, one subtraction
   ([recipes/pattern-then-subtract](pattern-then-subtract.md)); drafts = `taperAngle`; a repeated
   profile on several planes is a pattern or a revolve, not N sketches.
6. **No scaffolding.** Work geometry only where a feature or joint needs it. No mate
   coordinate systems sprinkled into parts, no constraint that only restates where an
   instance already is.
7. **Joints only where something moves**: one rigid group per moving body, one revolute per joint
   on its true axis, gear relations for meshes and belts (section 3). Static parts are placed
   exactly; sub-assemblies mirror the design — never invent one, never flatten a real one.
8. **Native geometry.** An imported body is a placeholder, not a part — it can arrive broken (a
   sheet instead of a solid). Rebuild purchased parts natively at the depth the model needs
   ("exterior-faithful": everything visible exact, hidden internals listed as omitted).
9. **Every feature must change the result.** A feature that adds no volume, cuts nothing or
   duplicates another is creep — delete it.
10. **Verify without side effects** (section 4): templates and the root, never single instances.

## 1. Audit first, audit last

Run this on any loaded drawing. Before a cleanup it is the to-do list; after a build it is the
delivery gate: every finding is fixed, or named to the user with its reason, before `save`.
Read-only (it ends by making the root the current product again).

```js
// Model audit: clutter, duplication, feature creep. Read-only; run it before a cleanup and after it.
const T = await api.tree({ refresh: true }), all = Object.values(T)
const kids = n => (n?.children ?? []).map(id => T[id]).filter(Boolean)
const set = (n, cls) => kids(n).find(c => c.class === cls)
const val = (n, k) => n?.members?.[k]?.value
const r3 = v => Math.round(v * 1000) / 1000
const DEFAULT_GEO = new Set(['Origin', 'XAxis', 'YAxis', 'ZAxis', 'Top', 'Front', 'Right'])
const root = all.find(n => n.class === 'CC_AssemblyRoot')
const parts = all.filter(n => n.class === 'CC_Part'), asms = all.filter(n => n.class === 'CC_Assembly')
const refs = all.filter(n => n.class === 'CC_ProductReference')
const used = new Set(refs.map(r => val(r, 'productId')))
const findings = {}
const flag = (rule, where, detail) => {
  const f = (findings[rule] ??= { n: 0, examples: [] })
  f.n++
  if (f.examples.length < 4) f.examples.push(`${where}: ${detail}`)
}
// A sketch's geometry, order-free: curve type + points + radius (radii matter: an OD and its bore share a centre)
const sig = sk => kids(sk).filter(c => /^CC_(Line|Arc|Circle)$/.test(c.class)).map(c => c.class +
  kids(c).map(p => val(p, 'pos')).filter(Boolean).map(p => `${r3(p.x)},${r3(p.y)}`).sort().join(';') +
  (c.members?.radius ? `r${r3(val(c, 'radius'))}` : '')).sort().join('|')

const counts = { partTemplates: parts.length, assemblyTemplates: asms.length, instances: refs.length,
  sketches: 0, features: 0, workGeometry: 0, expressions: 0 }
const byVolume = {}, weight = []
for (const p of parts) {
  const sketches = kids(set(p, 'CC_SketchSet')), features = kids(set(p, 'CC_EntitySet'))
  const workGeo = kids(set(p, 'CC_GeometrySet')).filter(g => /^CC_Work/.test(g.class) && !DEFAULT_GEO.has(g.name))
  const exprs = Object.entries(set(p, 'CC_ExpressionSet')?.members ?? {}).filter(([k]) => k !== '_VERSION')
  counts.sketches += sketches.length; counts.features += features.length
  counts.workGeometry += workGeo.length; counts.expressions += exprs.length
  weight.push([p.name, sketches.length + features.length + workGeo.length])
  const imports = features.filter(f => /Import/.test(f.class)).length
  if (imports) flag('imported body', p.name, `${imports} import feature(s)`)
  // The same profile again: on the same plane a doubled feature, on another plane a missed revolve/pattern
  const seen = new Map()
  for (const sk of sketches) {
    const s = sig(sk), plane = val(sk, 'planeReference'), twin = s && seen.get(s)
    if (twin) flag(twin.plane === plane ? 'doubled sketch' : 'repeated profile', p.name, `${sk.name} = ${twin.name}`)
    else if (s) seen.set(s, { name: sk.name, plane })
  }
  // One shape split up: several extrusions of one depth from sketches on one plane (pattern seeds excepted)
  const seeds = new Set(features.filter(f => /Pattern$/.test(f.class))
    .flatMap(f => (f.members?.toPattern?.members ?? []).map(m => (T[m.value]?.class === 'CC_Solid' ? T[m.value].parent : m.value))))
  const split = {}, base = features.find(f => f.class === 'CC_Extrusion')
  for (const f of features.filter(f => f.class === 'CC_Extrusion' && !seeds.has(f.id))) {
    const sk = T[val(T[val(f, 'region')], 'sketch')]
    const key = `${val(sk, 'planeReference')}|${r3((val(f, 'limit2') ?? 0) - (val(f, 'limit1') ?? 0))}`
    ;(split[key] ??= []).push(f)
  }
  for (const [k, fs] of Object.entries(split)) if (fs.length > 2 || (fs.length > 1 && fs.includes(base)))
    flag('one shape, several sketches', p.name, `${fs.length} extrusions of depth ${k.split('|')[1]} on one plane (${fs.slice(0, 3).map(f => f.name).join(', ')})`)
  // Coordinates disguised as parameters: one expression per vertex coordinate, scale factors of 1
  const coords = exprs.filter(([k, e]) => /(^|_)P\d+_?[XYZ]$/i.test(k) || (/scale/i.test(k) && e.value === 1))
  if (coords.length >= 3) flag('coordinates as parameters', p.name, `${coords.length} of ${exprs.length} expressions, e.g. ${coords[0][0]}`)
  const mates = workGeo.filter(g => /mate/i.test(g.name ?? '')).length
  if (mates) flag('mate scaffolding', p.name, `${mates} work geometry objects named *mate*`)
  if (root && !used.has(p.id) && features.length) flag('unused template', p.name, 'no instance')
  if (features.length) {
    const v = await api.v1.assembly.calculateMassProperties({ id: p.id }) // a template: safe to measure
      .then(r => r.result.volume, e => String(e.message ?? e).slice(0, 60))
    if (!(v > 0)) flag('invalid body', p.name, `volume ${v}`)
    else (byVolume[v.toPrecision(5)] ??= []).push(p.name)
  }
}
for (const names of Object.values(byVolume)) if (names.length > 1)
  flag('same volume', names.join(' | '), 'one shape, one template? (a mirror pair stays two)')
// Per live body: faces that tessellate to nothing (slivers between near-coincident edges), and a body far from
// its part's origin (world position baked into the part instead of the instance transform)
const live = new Set(all.filter(n => n.class === 'CC_Solid' && val(n, 'consumed') === 0).map(n => n.id))
const box = {}
for (const c of (await api.graphic()).containers ?? []) {
  if (!live.has(c.owner)) continue
  let p = T[c.owner]
  while (p && p.class !== 'CC_Part') p = T[p.parent]
  const empty = (c.meshes ?? []).filter(m => !m.vertices?.length).length
  if (empty) flag('sliver faces', p?.name ?? c.owner, `${empty} face(s) without triangles`)
  const [lo, hi] = [c.properties.min, c.properties.max], b = (box[p?.name] ??= { lo: [...lo], hi: [...hi] })
  for (let i = 0; i < 3; i++) { b.lo[i] = Math.min(b.lo[i], lo[i]); b.hi[i] = Math.max(b.hi[i], hi[i]) }
}
for (const [name, { lo, hi }] of Object.entries(box)) {
  const gap = Math.hypot(...[0, 1, 2].map(i => Math.max(lo[i], 0, -hi[i]))), size = Math.max(...[0, 1, 2].map(i => hi[i] - lo[i]))
  if (gap > size) flag('far from origin', name, `body ${r3(gap)} mm away from the part origin, ${r3(size)} mm in size`)
}
if (root) {
  const constraints = [root, ...asms].flatMap(a => kids(set(a, 'CC_ConstraintSet')))
  counts.constraints = constraints.length
  const fastened = constraints.filter(c => /Fastened/.test(c.class)).length
  if (fastened >= refs.length / 2) flag('placement mates', root.name, `${fastened} fastened constraints for ${refs.length} instances`)
  if (!asms.length && root.instances.length > 30) flag('flat structure', root.name, `${root.instances.length} instances, no sub-assembly`)
  const materialized = all.filter(n => /^CC_ProductReference/.test(n.class) && n.geometryIdList).length
  if (materialized) flag('materialized instances', root.name, `${materialized} instance(s) with their own geometryIdList`)
  await api.v1.assembly.setCurrentProduct({ id: root.id }) // leave the root active
}
const heaviest = weight.sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, w]) => `${n}: ${w}`)
return { counts, findings, heaviest }
```

| Finding | What it means | The clean construction |
|---|---|---|
| `imported body`, `invalid body` | a STEP placeholder; volume ≤ 0 or an error = it is not even a solid | rebuild natively (rule 8) |
| `doubled sketch` | the same profile twice on one plane | delete one, with its feature |
| `repeated profile` | the same profile re-sketched on another plane | one revolve, or one seed + pattern |
| `one shape, several sketches` | base outline and cutouts extruded separately at the same depth | one sketch with every loop, one extrusion |
| `coordinates as parameters` | an expression per vertex, scale factors of 1 | named design values in a design frame (section 2) |
| `far from origin` | the part is modeled where it sits in the assembly | re-frame the part; the offset goes into the instance |
| `mate scaffolding`, `placement mates` | constraints that pin every instance where it already is | delete them; joints only where something moves |
| `same volume` | candidates for one shape in several templates | confirm (face count, size), then one template + instances |
| `unused template` | a leftover | delete |
| `flat structure` | no sub-assembly in a large assembly | mirror the design's sub-assemblies (moving groups, purchased units) |
| `sliver faces` | near-coincident edges left micro-faces (0.3–6 µm) that tessellate to nothing | make coincident geometry exactly coincident, or keep a real gap |
| `materialized instances` | an instance was measured; after save/load the apps draw nothing for it | re-create the instances in place (section 4) |

The findings are candidates: confirm each hit before acting (a mirror pair has the same volume
and stays two templates; two machining steps may share a depth and stay two features). The first
duplicate detector in the case above ignored circle radii and planes and reported 22 "identical"
sketch pairs; with radii and planes it is 7 repeated profiles and no doubled feature.

## 2. Part construction

Design values first, then sketches in the part's own frame, then one feature per operation:

```js
const W = (pid, name) => api.v1.part.getWorkGeometry({ id: pid, name }).then(r => r.result)
const pid = (await api.v1.assembly.partTemplate({ name: 'Motor plate' })).result
await api.v1.part.expression({ id: pid, toCreate: [
  { name: 'Thickness', value: '0.25*25.4' },
  { name: 'BoltCircleD', value: 50 },
  { name: 'BoltCount', value: 4 },
  { name: 'BoltStep', value: '2*C:PI/BoltCount' },
] })
// Outline + bore + every pocket: ONE sketch on Top, the part's axis at the origin.
// Constrain and dimension it (@expr bindings) per recipes/constrained-sketching.
const sk = (await api.v1.sketch.create({ id: pid, planeId: await W(pid, 'Top'), name: 'Plate' })).result
// … sketch.geometry({ id: sk, lines, arcs, circles, genFixation: false, … }), constraints, dimensions …
const loops = (await api.v1.sketch.getObjectsLists({ id: sk })).result.solidGeometry // every non-construction curve
const body = (await api.v1.part.extrusion({ id: pid, name: 'Plate', references: loops, limit2: '@expr.Thickness' })).result
// N equal holes: one seed, one merged pattern, one subtraction (recipes/pattern-then-subtract)
// Turned part: one half-section on Front, one revolve about the part axis:
//   api.v1.part.revolve({ id: pid, name: 'Body', references: halfSectionCurves, axisIds: [await W(pid, 'ZAxis')] })
```

- **Traced or measured geometry** (vendor parts without drawings) is fixed honestly — a FIXATION
  per joint, radii per family — not dressed up as parameters. Snap traced coordinates that should
  coincide (across layers, sketches, features) so they coincide exactly: noise of 1e-4…1e-5 mm
  breaks booleans or leaves sliver faces. Close every traced loop.
- **Read the faces before you trace sections.** Cones on a hole axis are drill points or
  countersinks, tilted planes are bevels, tori on a tangential axis are cutter run-outs — each one
  feature. A stack of section slices misses them (in the case above: −0.64 % volume, then
  +0.0003 % once the faces were read).
- **A kernel workaround is a named expression with its reason**, never an anonymous offset
  (`CrossHoleRelief = 0.001`: booleans between equal-radius cylinders whose axes intersect fail).

## 3. Assembly construction

```js
// One template per shape, built once in its design frame; every occurrence is an instance.
const screw = (await api.v1.assembly.partTemplate({ name: 'M3x24 BHCS' })).result
// … build it …
await api.v1.assembly.setCurrentProduct({ id: rootId })
for (const [o, x, y, name] of placements) // origin, x direction, y direction in assembly coordinates
  await api.v1.assembly.instance({ productId: screw, ownerId: rootId, transformation: [o, x, y], name })
```

- **Converting an existing model or a STEP**: map each source definition to a clean template and
  a frame `A` (clean template frame → source definition frame); place every occurrence at
  `W = T_source · A`. Find the design frame from the part's features (principal axes, hole and
  flat directions), so sketches stay axis-aligned.
- **Grouping**: definitions with the same shape collapse into one template (audit `same volume`,
  then compare face counts and sizes). Mirror pairs stay two templates — name them as a pair.
- **Structure**: reproduce the design's sub-assemblies (`assembly.assemblyTemplate` + instances
  inside it, one instance of the sub-assembly per occurrence) — purchased units and repeated
  groups in particular. Do not invent levels: a set that only has to move as one is a rigid
  group (`assembly.group`, below), not a new sub-assembly.
- **Static placement needs no constraint at all.** Constraints are for motion.

### Joints that move

The moving structure is a few rigid groups and one joint per motion — never a fastened
constraint per part:

```js
const asm = api.v1.assembly
await asm.fastenedOrigin({ id: rootId, name: 'Ground', mate1: { path: [frame], csys: frameBase } })
const pitch = (await asm.revolute({ id: rootId, name: 'Pitch', mate1: { path: [frame], csys: frameHinge },
  mate2: { path: [plate], csys: plateHinge }, zRotationLimits: { min: 0, max: '47deg' } })).result
const roller = (await asm.revolute({ id: rootId, name: 'Roller spin', mate1: { path: [plate], csys: plateRoller },
  mate2: { path: [shaft], csys: shaftAxis } })).result
await asm.group({ id: rootId, name: 'Body', instanceIds: bodyIds })     // moves as one with the plate
await asm.group({ id: rootId, name: 'Roller', instanceIds: rollerIds }) // shaft, wheels, spacers, pulleys
await asm.gear({ id: rootId, name: 'Belt 24:15', constr1Id: motorSpin, constr2Id: roller, ratio: -(24 / 15) * s1 * s2 })
await asm.update3DConstraintValue({ id: pitch, name: 'Z_ROTATION', value: '20deg' }) // test it by driving it
```

- **Read the motion from the geometry**: which parts share an axis (the turned parts' axis
  frames), which gears mesh (center distance = sum of the pitch radii), which pulleys a belt
  wraps (its vertices lie around both axes). Bearings, bushings and motor bodies on a shaft axis
  move with the structure, not with the shaft. A source model's reference parts can be off: in
  the case above one reference belt sat rotated away from its pulleys — couple the pulleys.
- **A joint frame coincides with the mating part's own axis frame**: express that frame in the
  anchor part (`workCSys` offset + `rotation`; the rotation is `Rx·Ry·Rz`, its columns the frame
  axes) and mate the two. Creating the joints then moves nothing — compare every
  `coordinateSystem` before and after (Δ = 0 in the case above).
- **Gear ratios carry signs**: driven angle = −ratio · driver angle, each about its own joint Z.
  Meshes counter-rotate, belts co-rotate; multiply by s1·s2 (+1 or −1: the joint Z along or
  against the shared world axis).
- **A frame that is not in the model** (the robot the mechanism mounts on): a geometry-free
  reference part holding the ground and hinge frames, named for what it stands for. Never ground
  a part that moves.
- **Drive every joint once** and read the angles from `coordinateSystem`: they must come out
  exact (20.000° pitch; 38° at the gearbox → −26.000° at a 26:38 mesh; 30° at a motor → 48.000°
  through a 24:15 belt). Limits clamp (60° → 47°). Free spin joints hold no angle: when the body
  pitches, the solver keeps them as still as it can in world.
- Constraint names are unique across kinds — a group named like a revolute becomes `Roller A0`:
  name them apart (`Roller A spin` / `Roller A`). Save from the pose you built in (reload after
  motion tests): free joints driven back to zero land within ~1e-4 mm, not exactly.

## 4. Verify without side effects

**Never measure an instance.** `calculateMassProperties({ id: instanceId })` materializes EVERY
instance of the assembly (`isDirty` 0 and an own `geometryIdList`, also for instances of other
templates). After an OFB save and load those lists point at nothing, so Buerligons and buerli
apps — which draw an instance from its `geometryIdList` when it has one — show only the
instances that were never measured (in the case above: only the two sub-assemblies), and
buerli-modeler hung on the file ("Maximum update depth exceeded"). Measuring templates or the
root, `api.tree()` and `api.graphic()` leave the instances alone.

```js
// Placement, arithmetically: world COG = instance transform · template COG (measuring a TEMPLATE is safe)
const t = await api.tree({ refresh: true }), cog = {}
for (const n of Object.values(t).filter(n => n.class === 'CC_ProductReference' && n.link != null)) {
  const c = (cog[n.link] ??= (await api.v1.assembly.calculateMassProperties({ id: n.link })).result.cog)
  const [o, x, y, z] = n.coordinateSystem // local to its owner: chain the owners for nested instances
  const world = [0, 1, 2].map(i => o[i] + x[i] * c.x + y[i] * c.y + z[i] * c.z)
  // compare `world` with the expected position (source COG, drawing, spec)
}
```

- **Templates**: volume against the design math or the source definition
  ([recipes/verification](verification.md) Part II). `calculateMassProperties` is an
  approximate integration (−0.1 % on a rail with 168 holes): compare with a tolerance, and
  prove tight claims in an exact kernel from a STEP export.
- **The whole**: root volume = the sum of the template volumes over all leaf instances
  (sub-assembly members once per sub-assembly instance).
- **Before saving**: run the audit, then `assembly.setCurrentProduct({ id: rootId })` — the
  current product is saved with the file.
- **After saving**: load the file again and check that every instance draws from its template:

```js
const t = await api.tree({ refresh: true }), all = Object.values(t)
const broken = all.filter(n => /^CC_ProductReference/.test(n.class) && n.geometryIdList)
// Repair (constraints that referenced these instances must be re-created too):
for (const owner of all.filter(n => n.class === 'CC_Assembly' || n.class === 'CC_AssemblyRoot')) {
  const rows = (owner.instances ?? []).map(id => t[id])
  if (!rows.some(n => n.geometryIdList)) continue
  await api.v1.assembly.deleteInstance({ ids: rows.map(n => n.id) })
  for (const n of rows) await api.v1.assembly.instance({ productId: n.members.productId.value, ownerId: owner.id,
    transformation: n.coordinateSystem.slice(0, 3), name: n.name })
}
```

## 5. Cleaning up an existing model

1. **Audit** it (section 1) and save the result: it is the before-picture and the to-do list.
2. **Map** definitions to distinct shapes: one template each, with its frame `A`.
3. **Rebuild** each template in its design frame by the rules — one sketch per shape, one
   feature per operation, design values as expressions — and check its volume against the old one.
4. **Place** the instances (`W = T · A`) in the design's sub-assemblies; verify placement
   arithmetically (section 4).
5. **Delete** what the audit listed: scaffolding, placement mates, unused templates, imports.
6. **Audit again**, save, reload, check (section 4). Report both audits to the user, and list
   every simplification (omitted hidden internals, simplified details) with its volume delta.

## Related

[recipes/verification](verification.md) · [recipes/parametric-part](parametric-part.md) ·
[recipes/pattern-then-subtract](pattern-then-subtract.md) · [recipes/assembly-parameters](assembly-parameters.md) ·
[SKETCHING](constrained-sketching.md) · [assembly/generic](../references/assembly/generic.md) ·
[assembly/calculateMassProperties](../references/assembly/calculateMassProperties.md) · [DATA](../references/DATA.md)
