export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Two instances, only A is constrained initially
  const instA = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'A',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const instB = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Constrain A at xOffset=0 (origin)
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO',
    mate1: { path: [instA], csys: wcs },
    xOffset: 200,
  })).result

  // COG before: A at xOffset=200 [COG 220,15,10], B at transform [80,0,0] [COG 100,15,10]
  // Combined: [(220+100)/2, 15, 10] = [160, 15, 10]
  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[07] COG before path update:', JSON.stringify(cogBefore))
  await snapshot('before-path')

  // Now update path to target instB instead of instA
  // instB is unconstrained — xOffset=200 should move it to [200,0,0]
  // instA should revert to its initial transform [0,0,0]
  const upR = await api.v1.assembly.updateFastenedOrigin({
    id: foId, mate1: { path: [instB] },
  })
  console.log('[07] update path result:', upR.result, 'maxLevel:', upR.maxLevel)
  if (upR.messages?.length) {
    for (const m of upR.messages) console.log('[07] msg:', m.message, 'code:', m.code)
  }

  // Expected: A at initial transform [0,0,0] COG [20,15,10], B at xOffset=200 COG [220,15,10]
  // Combined: [(20+220)/2, 15, 10] = [120, 15, 10]
  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[07] COG after path update:', JSON.stringify(cogAfter))
  await snapshot('after-path')

  const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO' })).result
  console.log('[07] state path:', JSON.stringify(state?.mate1?.path), 'xOffset:', state?.xOffset)

  filewrite({
    instA, instB,
    cogBefore,
    cogAfter,
    updateResult: upR.result,
    stateAfter: state,
  }, 'path-unconstrained')

  return { foId }
}
