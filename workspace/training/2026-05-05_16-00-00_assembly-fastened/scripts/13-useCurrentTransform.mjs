export default async function (api, { snapshot, filewrite }) {
  // Test useCurrentTransform: locks current relative position as constraint
  const asmId = (await api.v1.assembly.create({})).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'O', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Place inst2 at specific offset (75, 20, 10)
  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[75, 20, 10], [1, 0, 0], [0, 1, 0]],
  })).result

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[13] COG before:', JSON.stringify(massBefore?.cog))

  // Create fastened with useCurrentTransform: TRUE
  const r = await api.v1.assembly.fastened({
    id: asmId, name: 'F_UCT',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    useCurrentTransform: 1,  // TRUE as integer
  })
  console.log('[13] fastened with UCT:', r.result, 'maxLevel:', r.maxLevel)

  await api.v1.common.recalc({})
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[13] COG after UCT:', JSON.stringify(massAfter?.cog))
  // If useCurrentTransform preserves position, COG should stay the same

  // Check what offsets were computed
  const get = await api.v1.assembly.getFastened({ id: asmId, name: 'F_UCT' })
  console.log('[13] computed offsets:', JSON.stringify({
    x: get.result?.xOffset,
    y: get.result?.yOffset,
    z: get.result?.zOffset,
  }))
  // Should be: xOffset=75, yOffset=20, zOffset=10 (the current transform)

  filewrite({ massBefore, massAfter, constraint: get.result }, 'uct-data')

  return { fastenedId: r.result }
}
