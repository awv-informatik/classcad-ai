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
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId,
    transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create two constraints with the SAME name
  const fId1 = (await api.v1.assembly.fastened({
    id: asmId, name: 'Dupe',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 80,
  })).result
  console.log('[07] first "Dupe" id:', fId1)

  const fId2 = (await api.v1.assembly.fastened({
    id: asmId, name: 'Dupe',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst3], csys: wcs },
    yOffset: 80,
  })).result
  console.log('[07] second "Dupe" id:', fId2)

  // Query — which one does it return?
  const r = await api.v1.assembly.getFastened({ id: asmId, name: 'Dupe' })
  console.log('[07] getFastened result id:', r.result?.id)
  console.log('[07] returns first (fId1)?', r.result?.id === fId1)
  console.log('[07] returns second (fId2)?', r.result?.id === fId2)
  console.log('[07] xOffset:', r.result?.xOffset, 'yOffset:', r.result?.yOffset)
  filewrite(r.result, 'duplicate-name-result')

  return { asmId }
}
