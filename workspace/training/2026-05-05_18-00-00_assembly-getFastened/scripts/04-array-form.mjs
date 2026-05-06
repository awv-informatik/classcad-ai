export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'P' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'M', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId,
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId,
    transformation: [[0, 60, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create two constraints
  await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })
  await api.v1.assembly.fastened({
    id: asmId, name: 'F2',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst3], csys: wcs },
    yOffset: 50,
  })

  // Array form query
  const r = await api.v1.assembly.getFastened([
    { id: asmId, name: 'F1' },
    { id: asmId, name: 'F2' },
  ])
  console.log('[04] array form maxLevel:', r.maxLevel)
  console.log('[04] result is array:', Array.isArray(r.result))
  console.log('[04] result length:', r.result?.length)
  filewrite(r.result, 'array-result')

  // Array form with one non-existent
  const r2 = await api.v1.assembly.getFastened([
    { id: asmId, name: 'F1' },
    { id: asmId, name: 'Nope' },
  ])
  console.log('[04] mixed array maxLevel:', r2.maxLevel)
  console.log('[04] mixed result:', JSON.stringify(r2.result?.map(x => x?.name ?? null)))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'array-mixed')

  return { asmId }
}
