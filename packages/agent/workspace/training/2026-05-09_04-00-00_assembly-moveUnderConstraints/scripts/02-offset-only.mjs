export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with unconstrained instance
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Wcs', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Free',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[02] COG before:', massBefore.cog)

  // Test 1: offset only, no rotation param — does it work?
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  const r1 = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [50, 30, 10],
  })
  console.log('[02] offset-only result:', r1.result, 'maxLevel:', r1.maxLevel)
  const massAfterOffset = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[02] COG after offset-only:', massAfterOffset.cog)
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Test 2: neither rotation nor offset — identity move
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  const r2 = await api.v1.assembly.moveUnderConstraints({ id: asmId })
  console.log('[02] empty-move result:', r2.result, 'maxLevel:', r2.maxLevel)
  const massAfterEmpty = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[02] COG after empty move:', massAfterEmpty.cog)
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  filewrite({
    before: massBefore.cog,
    afterOffset: massAfterOffset.cog,
    afterEmpty: massAfterEmpty.cog,
  }, 'offset-only-result')

  await snapshot('result')
  return { inst }
}
