export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Three instances
  const instA = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'A',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const instB = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const instC = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'C',
    transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Fix A and C at known positions
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_A', mate1: { path: [instA], csys: wcs },
  })
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_C', mate1: { path: [instC], csys: wcs }, xOffset: 120,
  })

  // Constrain B with xOffset=60
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_B',
    mate1: { path: [instB], csys: wcs },
    xOffset: 60,
  })).result

  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[06] COG with B constrained:', JSON.stringify(cogBefore))
  await snapshot('before-path-update')

  // Try to update mate1.path to point to instC instead of instB
  // This would mean "move this constraint to a different instance"
  const upR = await api.v1.assembly.updateFastenedOrigin({
    id: foId, mate1: { path: [instC] },
  })
  console.log('[06] update path result:', upR.result, 'maxLevel:', upR.maxLevel)
  if (upR.messages?.length) {
    for (const m of upR.messages) {
      console.log('[06] msg:', m.message, 'code:', m.code, 'level:', m.level)
    }
  }

  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[06] COG after path update:', JSON.stringify(cogAfter))
  await snapshot('after-path-update')

  // Check state
  const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_B' })).result
  console.log('[06] state after path update:', JSON.stringify(state?.mate1))

  filewrite({
    cogBefore,
    cogAfter,
    updateResult: upR.result,
    updateMaxLevel: upR.maxLevel,
    updateMessages: upR.messages,
    stateAfter: state,
  }, 'path-update')

  return { foId }
}
