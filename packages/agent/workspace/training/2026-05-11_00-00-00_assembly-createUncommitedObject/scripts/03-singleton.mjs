export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Inst1' })).result

  // Create first uncommitted
  const first = await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_FastenedOriginConstraint',
    name: 'First',
  })
  console.log('[03] first result:', first.result, 'maxLevel:', first.maxLevel)

  // Try to create a second uncommitted — should fail (singleton)
  const second = await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_FastenedConstraint',
    name: 'Second',
  })
  console.log('[03] second result:', second.result, 'maxLevel:', second.maxLevel)
  filewrite({ result: second.result, messages: second.messages, maxLevel: second.maxLevel }, 'singleton-error')

  // Also test: does it block normal constraint creation?
  const normalFO = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    instance: inst1,
    name: 'NormalFO',
    mate1: { path: [inst1], csys: wcs1 },
  })
  console.log('[03] normal fastenedOrigin result:', normalFO.result, 'maxLevel:', normalFO.maxLevel)
  filewrite({ result: normalFO.result, messages: normalFO.messages, maxLevel: normalFO.maxLevel }, 'normal-creation-during-uncommitted')

  // Clean up: decline the uncommitted
  await api.v1.part.openFeature({ id: first.result })
  await api.v1.part.closeFeature({ id: first.result })

  return { firstId: first.result }
}
