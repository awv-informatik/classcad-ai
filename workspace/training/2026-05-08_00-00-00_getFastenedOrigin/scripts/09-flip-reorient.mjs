export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  // Create with flip and reorient
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_FlipReorient',
    mate1: { path: [inst], csys: wcs, flip: '-Z', reorient: '180' },
    xOffset: 50,
  })).result

  const r = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_FlipReorient' })).result
  console.log('[09] flip:', r.mate1.flip, '(expected -Z)')
  console.log('[09] reorient:', r.mate1.reorient, '(expected 180)')
  console.log('[09] csys:', r.mate1.csys, '(expected', wcs, ')')
  console.log('[09] path:', r.mate1.path, '(expected [', inst, '])')
  filewrite(r, 'flip-reorient-result')

  return {}
}
