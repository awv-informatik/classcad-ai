export default async function (api, { snapshot, filewrite }) {
  // Simplest possible test: two identical templates, csys at template origin
  // Fastened should align them at the same spot
  const asmId = (await api.v1.assembly.create({})).result

  // Template: box 40x30x20 with csys at origin
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  const box = (await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })).result
  const wcs = (await api.v1.part.workCSys({ id: tpl, name: 'Origin', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  console.log('[02] tpl:', tpl, 'wcs:', wcs)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Inst1 at origin, Inst2 offset at (100, 0, 0)
  const inst1 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[02] inst1:', inst1, 'inst2:', inst2)

  // Measure before
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] COG before:', JSON.stringify(massBefore?.cog))
  console.log('[02] volume before:', massBefore?.volume)

  await snapshot('before')

  // Fastened: align inst2's origin csys to inst1's origin csys
  const r = await api.v1.assembly.fastened({
    id: asmId,
    name: 'Align',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
  })
  console.log('[02] fastened result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[02] messages:', JSON.stringify(r.messages))

  // Recalc explicitly
  await api.v1.common.recalc({})

  await snapshot('after')

  // Measure after
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] COG after:', JSON.stringify(massAfter?.cog))
  console.log('[02] volume after:', massAfter?.volume)

  filewrite({ massBefore, massAfter }, 'mass-comparison')

  // If both boxes are at origin with csys at (0,0,0), after fastened they should overlap
  // Part.box is corner-aligned: COG at (20,15,10)
  // Two overlapping boxes would have combined COG at (20,15,10), volume=24000 (mass props counts overlap? or doubled?)

  return { asmId, inst1, inst2, fastenedId: r.result }
}
