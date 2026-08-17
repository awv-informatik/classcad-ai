export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'OverrideTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 50, width: 40, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box', length: 20, width: 15, height: 25 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result

  // Place inst2 at (100, 100, 100) via transformation
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'BlockInst',
    transformation: [[100, 100, 100], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before-constraint')

  // Now apply fastened with xOffset=25 — does it override the (100,100,100)?
  const r = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_Override',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 25,
    zOffset: 10,
  })
  console.log('[11] override result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-constraint')

  // Read back constraint to verify offsets
  const getR = await api.v1.assembly.getFastened({ id: asmId, name: 'F_Override' })
  console.log('[11] getFastened:', JSON.stringify(getR.result))
  filewrite(getR.result, 'override-getFastened')

  // Test: what if we also have fastenedOrigin on inst1? Can one instance have
  // both fastenedOrigin AND be in a fastened pair?
  const fo = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_Base',
    mate1: { path: [inst1], csys: wcs1 },
  })
  console.log('[11] fastenedOrigin result:', fo.result, 'maxLevel:', fo.maxLevel)
  filewrite({ result: fo.result, messages: fo.messages, maxLevel: fo.maxLevel }, 'fo-response')

  await snapshot('with-fo')

  return { asmId }
}
