export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'OffsetTest' })).result

  // Two part templates — base (flat, blue) and block (taller, orange)
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [30, 20, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box', length: 20, width: 20, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [10, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'BlockInst',
  })).result

  // Fastened with offsets — should position block above and to the right of base
  const r = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_Offset',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 20,
    yOffset: 0,
    zOffset: 10,
  })
  console.log('[02] fastened result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'offset-response')

  await snapshot('offset')

  // Test with negative offsets
  // Delete constraint and re-create? Or just create another pair.
  // Create a third instance for negative offset test
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'BlockInst2',
  })).result
  const r2 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_NegOffset',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs2 },
    xOffset: -20,
    yOffset: 10,
    zOffset: 0,
  })
  console.log('[02] neg offset result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('neg-offset')

  return { asmId, constraintId: r.result }
}
