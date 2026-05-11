export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with unconstrained instance at non-origin
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Free',
    transformation: [[30, 20, 10], [1, 0, 0], [0, 1, 0]],
  })).result

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[02] COG before:', massBefore.cog)

  // Start session but DON'T call moveUnderConstraints — go straight to finish
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  console.log('[02] startMoving called, skipping moveUnderConstraints...')

  const r = await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  console.log('[02] finish result:', r.result, 'maxLevel:', r.maxLevel)

  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[02] COG after start→finish (no move):', massAfter.cog)

  filewrite({
    before: massBefore.cog,
    after: massAfter.cog,
    positionUnchanged: JSON.stringify(massBefore.cog) === JSON.stringify(massAfter.cog),
    finishResult: { result: r.result, maxLevel: r.maxLevel },
  }, 'start-finish-no-move')

  return { inst }
}
