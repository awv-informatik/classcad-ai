export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'UpdateFOTest' })).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1',
    mate1: { path: [inst], csys: wcs },
    xOffset: 0, yOffset: 0, zOffset: 0,
  })).result
  console.log('[01] fastenedOrigin created, foId:', foId)

  // Get before state
  const before = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[01] before offsets:', before.xOffset, before.yOffset, before.zOffset)
  filewrite(before, 'before-state')

  await snapshot('before')

  // Update xOffset only
  const r1 = await api.v1.assembly.updateFastenedOrigin({ id: foId, xOffset: 60 })
  console.log('[01] update xOffset result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'update-xoffset-response')

  await snapshot('after-xoffset')

  // Get after state — check that only xOffset changed
  const after = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[01] after offsets:', after.xOffset, after.yOffset, after.zOffset)
  console.log('[01] partial update preserved yOffset?', after.yOffset === 0 ? '✓' : '❌')
  console.log('[01] partial update preserved zOffset?', after.zOffset === 0 ? '✓' : '❌')
  filewrite(after, 'after-state')

  return { foId, asmId }
}
