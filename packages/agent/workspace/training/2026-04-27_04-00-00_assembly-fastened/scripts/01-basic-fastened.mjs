export default async function (api, { snapshot, filewrite }) {
  // Create assembly
  const asmId = (await api.v1.assembly.create({ name: 'FastenedTest' })).result
  console.log('[01] asmId:', asmId)

  // Create two part templates with different shapes for visual distinction
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS1', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[01] tpl1:', tpl1, 'wcs1:', wcs1)

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box', length: 30, width: 25, height: 40 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[01] tpl2:', tpl2, 'wcs2:', wcs2)

  // Switch to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create two instances (without transformation — both at origin initially)
  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'BlockInst',
  })).result
  console.log('[01] inst1:', inst1, 'inst2:', inst2)

  // Snapshot before constraint
  await snapshot('before')

  // Create fastened constraint — mates csys of inst1 to csys of inst2
  const r = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[01] fastened result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'fastened-response')

  // Snapshot after constraint
  await snapshot('after')

  return { asmId, inst1, inst2, constraintId: r.result }
}
