export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RevGetTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Arm', length: 15, width: 50, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [0, 25, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmInst',
  })).result

  // Create revolute with a custom name
  const cId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'MyHinge',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[02] revolute created:', cId)

  // getRevolute by name
  const g = await api.v1.assembly.getRevolute({ id: asmId, name: 'MyHinge' })
  console.log('[02] getRevolute maxLevel:', g.maxLevel)
  filewrite(g.result, 'getRevolute-result')

  // getRevolute with default name (should return VOID)
  const g2 = await api.v1.assembly.getRevolute({ id: asmId, name: 'Revolute' })
  console.log('[02] getRevolute default name result:', g2.result, 'maxLevel:', g2.maxLevel)
  filewrite({ result: g2.result, messages: g2.messages, maxLevel: g2.maxLevel }, 'getRevolute-default-name')

  await snapshot('constrained')

  return { asmId, cId }
}
