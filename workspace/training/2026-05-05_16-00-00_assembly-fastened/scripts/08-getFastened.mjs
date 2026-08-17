export default async function (api, { snapshot, filewrite }) {
  // Test getFastened: does it return the full constraint state?
  const asmId = (await api.v1.assembly.create({})).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'O', origin: [10, 5, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create with specific offsets and rotation
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'MyFastened',
    mate1: { path: [inst1], csys: wcs, flip: '-Z', reorient: '90' },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 25, yOffset: 10, zOffset: -5,
    xRotation: 0.5, yRotation: '30deg',
  })).result
  console.log('[08] fastened id:', fId)

  // Query it back
  const r = await api.v1.assembly.getFastened({ id: asmId, name: 'MyFastened' })
  console.log('[08] getFastened maxLevel:', r.maxLevel)
  filewrite(r.result, 'getFastened-result')

  // Also test: get by non-existent name
  const r2 = await api.v1.assembly.getFastened({ id: asmId, name: 'NonExistent' })
  console.log('[08] non-existent name maxLevel:', r2.maxLevel, 'result:', r2.result)
  if (r2.messages?.length) console.log('[08] non-existent messages:', JSON.stringify(r2.messages))

  return { fId }
}
