export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'BatchTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 80, width: 60, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Peg' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'Cyl', height: 20, diameter: 8 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result

  // Create 4 peg instances
  const pegs = []
  for (let i = 0; i < 4; i++) {
    const inst = (await api.v1.assembly.instance({
      productId: tpl2, ownerId: asmId, name: `Peg${i}`,
    })).result
    pegs.push(inst)
  }
  console.log('[06] pegs:', pegs)

  // Batch-create fastened constraints — array of param objects
  const r = await api.v1.assembly.fastened([
    { id: asmId, name: 'F_P0', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [pegs[0]], csys: wcs2 }, xOffset: 10, yOffset: 10, zOffset: 10 },
    { id: asmId, name: 'F_P1', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [pegs[1]], csys: wcs2 }, xOffset: 60, yOffset: 10, zOffset: 10 },
    { id: asmId, name: 'F_P2', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [pegs[2]], csys: wcs2 }, xOffset: 10, yOffset: 40, zOffset: 10 },
    { id: asmId, name: 'F_P3', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [pegs[3]], csys: wcs2 }, xOffset: 60, yOffset: 40, zOffset: 10 },
  ])
  console.log('[06] batch result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('batch')

  return { asmId }
}
