export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_Flip' })).result

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

  // Create with non-default flip and reorient
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_Flip',
    mate1: { path: [inst], csys: wcs, flip: '-X', reorient: '180' },
    xOffset: 25,
  })).result

  const r = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Flip' })
  console.log('[05] mate1.flip:', r.result.mate1.flip, '(expected: -X)')
  console.log('[05] mate1.reorient:', r.result.mate1.reorient, '(expected: 180)')
  console.log('[05] mate1.path:', r.result.mate1.path)
  console.log('[05] mate1.csys:', r.result.mate1.csys)

  filewrite(r.result, 'get-flip-reorient')

  await snapshot('flip-result')

  return { asmId, foId }
}
