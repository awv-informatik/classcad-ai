export default async function (api, { snapshot, filewrite }) {
  // Create assembly with one template + geometry + WCS
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[01] asmId:', asmId)

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  console.log('[01] tplId:', tpl)

  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[01] wcsId:', wcs)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instance at offset [80, 50, 30] so it's not at origin
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
    transformation: [[80, 50, 30], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[01] instId:', inst)

  // Measure COG before fastenedOrigin
  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[01] COG before:', JSON.stringify(cogBefore?.centerOfGravity))

  await snapshot('before')

  // Apply fastenedOrigin — no offsets, no rotations
  const foR = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO1',
    mate1: { path: [inst], csys: wcs },
  })
  console.log('[01] fastenedOrigin result:', foR.result, 'maxLevel:', foR.maxLevel)
  filewrite({ result: foR.result, messages: foR.messages, maxLevel: foR.maxLevel }, 'fo-response')

  // Measure COG after — should be at origin (part.box is corner-aligned, so COG ~ [20,15,10])
  // Wait, this is part.box in a template. part.box is corner-aligned at (+X+Y+Z).
  // With fastenedOrigin at 0 offsets, the instance should be at the assembly origin.
  // So COG should be ~ [20, 15, 10] (half of 40x30x20 box).
  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[01] COG after:', JSON.stringify(cogAfter?.centerOfGravity))
  filewrite({ cogBefore: cogBefore?.centerOfGravity, cogAfter: cogAfter?.centerOfGravity }, 'cog-comparison')

  await snapshot('after')

  return { asmId, tpl, inst, foId: foR.result }
}
