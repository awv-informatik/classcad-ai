export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'DupNameTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 30, width: 20, height: 15 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'A',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'B',
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'C',
  })).result

  // Create two constraints with the same name
  const r1 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'SameName',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 40,
  })
  console.log('[08] first SameName:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'SameName',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst3], csys: wcs },
    yOffset: 30,
  })
  console.log('[08] second SameName:', r2.result, 'maxLevel:', r2.maxLevel)

  // Now getFastened with the duplicate name — which one comes back?
  const getR = await api.v1.assembly.getFastened({ id: asmId, name: 'SameName' })
  console.log('[08] getFastened SameName id:', getR.result?.id)
  filewrite(getR.result, 'dup-getFastened')

  // Also test: constraint with no name (uses default "Fastened")
  const r3 = await api.v1.assembly.fastened({
    id: asmId,
    mate1: { path: [inst2], csys: wcs },
    mate2: { path: [inst3], csys: wcs },
    xOffset: 20,
    yOffset: 20,
  })
  console.log('[08] default name:', r3.result, 'maxLevel:', r3.maxLevel)

  // Read it back with the default name
  const getDefault = await api.v1.assembly.getFastened({ id: asmId, name: 'Fastened' })
  console.log('[08] getFastened default:', getDefault.result?.id, getDefault.result?.name)
  filewrite(getDefault.result, 'default-name-getFastened')

  await snapshot('dup-names')

  return { asmId }
}
