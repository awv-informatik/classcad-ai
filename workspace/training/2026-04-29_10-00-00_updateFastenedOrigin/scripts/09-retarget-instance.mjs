export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RetargetTest' })).result

  // Two different templates
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'SmallBlock' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 30, width: 20, height: 15 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'TallBlock' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box', length: 20, width: 20, height: 50 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'Small',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'Tall',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Constrain inst1 to origin
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1',
    mate1: { path: [inst1], csys: wcs1 },
  })).result
  console.log('[09] initial foId:', foId, 'on inst1')

  const before = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[09] before — path:', JSON.stringify(before.mate1.path), 'csys:', before.mate1.csys)
  filewrite(before, 'before-retarget')
  await snapshot('before-retarget')

  // Retarget to inst2 with its WCS
  const r = await api.v1.assembly.updateFastenedOrigin({
    id: foId,
    mate1: { path: [inst2], csys: wcs2 },
  })
  console.log('[09] retarget result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'retarget-response')

  const after = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[09] after — path:', JSON.stringify(after.mate1.path), 'csys:', after.mate1.csys)
  filewrite(after, 'after-retarget')
  await snapshot('after-retarget')

  return { foId }
}
