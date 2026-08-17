export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'M', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Place instance at known position
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'UCT',
    transformation: [[75, 45, 20], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure COG before constraint
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[07] COG before:', JSON.stringify(massBefore?.cog))

  // Apply fastenedOrigin with useCurrentTransform — should NOT move instance
  const foR = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_UCT',
    mate1: { path: [inst], csys: wcs },
    useCurrentTransform: 1,
  })
  console.log('[07] fastenedOrigin result:', foR.result, 'maxLevel:', foR.maxLevel)

  // Measure COG after — should be same as before
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[07] COG after:', JSON.stringify(massAfter?.cog))

  // Check getFastenedOrigin to see back-computed offsets
  const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_UCT' })).result
  console.log('[07] state:', JSON.stringify(state))
  filewrite(state, 'uct-state')
  filewrite({ cogBefore: massBefore?.cog, cogAfter: massAfter?.cog }, 'uct-cog-comparison')

  return {}
}
