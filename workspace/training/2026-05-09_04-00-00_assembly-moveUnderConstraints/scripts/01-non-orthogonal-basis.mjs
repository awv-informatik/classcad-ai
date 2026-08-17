export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with a free (unconstrained) instance
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
  console.log('[01] COG before:', massBefore.cog)

  // Test: non-orthogonal basis vectors (xDir and yDir not perpendicular)
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })

  const r = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [1, 1, 0], yDir: [0, 1, 0], zDir: [0, 0, 1] },  // xDir not perp to yDir
  })
  console.log('[01] non-orthogonal move result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) {
    console.log('[01] messages:', JSON.stringify(r.messages))
  }

  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[01] COG after non-orthogonal:', massAfter.cog)

  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Comparison: proper 45° rotation (orthogonal)
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.707, -0.707, 0], yDir: [0.707, 0.707, 0], zDir: [0, 0, 1] },
  })
  const massOrtho = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[01] COG after proper 45° (ortho):', massOrtho.cog)
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  filewrite({
    before: massBefore.cog,
    afterNonOrtho: massAfter.cog,
    afterOrtho: massOrtho.cog,
    nonOrthoMoveResult: r.result,
    nonOrthoMaxLevel: r.maxLevel,
    nonOrthoMessages: r.messages,
  }, 'non-orthogonal-result')

  await snapshot('non-orthogonal-result')
  return { inst }
}
