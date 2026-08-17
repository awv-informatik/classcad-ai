export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with unconstrained instance
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Free',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[04] COG before:', massBefore.cog)

  // Call finish without any prior start or move
  const r = await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  console.log('[04] finish without start: result=', r.result, 'maxLevel=', r.maxLevel)
  if (r.messages?.length) {
    console.log('[04] messages:', JSON.stringify(r.messages))
  }

  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[04] COG after finish-only:', massAfter.cog)

  filewrite({
    before: massBefore.cog,
    after: massAfter.cog,
    positionUnchanged: JSON.stringify(massBefore.cog) === JSON.stringify(massAfter.cog),
    finishResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
  }, 'finish-only-result')

  return { inst }
}
