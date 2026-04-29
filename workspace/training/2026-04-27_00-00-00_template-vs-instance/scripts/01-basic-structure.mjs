export default async function (api, { snapshot, filewrite }) {
  // Create assembly with two part templates, each with different geometry
  const asmId = (await api.v1.assembly.create({ name: 'StructureTest' })).result
  console.log('[01] asmId:', asmId)

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 30 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Origin', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[01] tpl1:', tpl1, 'wcs1:', wcs1)

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'CylPart' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'Cyl1', height: 50, diameter: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Origin', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[01] tpl2:', tpl2, 'wcs2:', wcs2)

  // Switch back to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BoxInst1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BoxInst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'CylInst1',
    transformation: [[0, 60, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[01] inst1:', inst1, 'inst2:', inst2, 'inst3:', inst3)

  // Dump the full structure tree to understand template/instance representation
  const r = await api.v1.common.getAppVersion({})
  filewrite(r.structure, 'structure-full')

  await snapshot('assembly-overview')
  return { asmId, tpl1, tpl2, inst1, inst2, inst3, wcs1, wcs2 }
}
