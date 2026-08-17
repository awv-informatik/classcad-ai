export default async function (api, { snapshot, filewrite }) {
  // Clean flip test: no limits at all, just flip '-Z' on mate2
  // Compare COG to see flip effect without limit interference
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 40, width: 20, height: 10 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[30, 20, 15], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[07] COG before flip:', JSON.stringify(cogBefore?.cog))
  // Block local COG = [20, 10, 5], inst at [30,20,15] → world COG = [50, 30, 20]

  // No limits, just flip
  const r = await api.v1.assembly.parallel({
    id: asmId,
    name: 'FlipOnly',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB, flip: '-Z' },
  })
  console.log('[07] parallel result:', r.result, 'maxLevel:', r.maxLevel)

  const cogAfter = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[07] COG after flip -Z:', JSON.stringify(cogAfter?.cog))
  // With flip '-Z' (180° around X), local COG [20,10,5] → [20,-10,-5]
  // If position preserved: origin still at [30,20,15], world COG = [30+20, 20-10, 15-5] = [50, 10, 10]

  filewrite({ cogBefore: cogBefore?.cog, cogAfter: cogAfter?.cog }, 'flip-clean-cog')
  await snapshot('flip-only')
  return { asmId }
}
