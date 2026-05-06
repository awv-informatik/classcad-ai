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

  // Create one constraint
  await api.v1.assembly.fastened({
    id: asmId, name: 'Exists',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })

  // Query non-existent name
  const r1 = await api.v1.assembly.getFastened({ id: asmId, name: 'DoesNotExist' })
  console.log('[02] nonexistent maxLevel:', r1.maxLevel)
  console.log('[02] nonexistent result:', r1.result)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'nonexistent')

  // Query existing one for comparison
  const r2 = await api.v1.assembly.getFastened({ id: asmId, name: 'Exists' })
  console.log('[02] existing maxLevel:', r2.maxLevel)
  console.log('[02] existing result id:', r2.result?.id)

  return { asmId }
}
