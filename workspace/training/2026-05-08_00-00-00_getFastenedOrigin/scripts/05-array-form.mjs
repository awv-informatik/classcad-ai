export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_A',
    mate1: { path: [inst1], csys: wcs },
    xOffset: 10,
  })
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_B',
    mate1: { path: [inst2], csys: wcs },
    xOffset: 80, yOffset: 20,
  })

  // Batch query — both exist
  const r1 = await api.v1.assembly.getFastenedOrigin([
    { id: asmId, name: 'FO_A' },
    { id: asmId, name: 'FO_B' },
  ])
  console.log('[05] batch both found — result count:', Array.isArray(r1.result) ? r1.result.length : 'not array')
  console.log('[05] batch maxLevel:', r1.maxLevel)

  // Batch query — one exists, one not
  const r2 = await api.v1.assembly.getFastenedOrigin([
    { id: asmId, name: 'FO_A' },
    { id: asmId, name: 'MISSING' },
  ])
  console.log('[05] batch mixed — result:', JSON.stringify(r2.result))
  console.log('[05] batch mixed — maxLevel:', r2.maxLevel)

  filewrite({
    bothFound: { result: r1.result, maxLevel: r1.maxLevel },
    mixed: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'array-form-results')

  return {}
}
