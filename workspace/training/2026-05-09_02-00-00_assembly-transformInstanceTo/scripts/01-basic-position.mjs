export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })

  const refTplId = (await api.v1.assembly.partTemplate({ name: 'Ref' })).result
  await api.v1.part.sphere({ id: refTplId, name: 'S1', radius: 5 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Reference sphere at origin — stays fixed
  const refInst = (await api.v1.assembly.instance({
    productId: refTplId, ownerId: asmId, name: 'RefSphere',
  })).result

  // Block instance, initially at origin
  const inst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
  })).result

  console.log('[01] asmId:', asmId, 'inst:', inst, 'refInst:', refInst)

  // Measure initial COG
  const cog0 = (await api.v1.assembly.calculateMassProperties({ productId: asmId, instanceId: inst })).result
  console.log('[01] initial COG:', cog0?.centerOfGravity)

  await snapshot('before')

  // transformInstanceTo — set absolute position to [50, 30, 0]
  const r = await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[50, 30, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[01] transformInstanceTo result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  // Measure COG after
  const cog1 = (await api.v1.assembly.calculateMassProperties({ productId: asmId, instanceId: inst })).result
  console.log('[01] after COG:', cog1?.centerOfGravity)

  filewrite({ before: cog0?.centerOfGravity, after: cog1?.centerOfGravity }, 'cog-comparison')

  await snapshot('after')

  return { inst, asmId }
}
