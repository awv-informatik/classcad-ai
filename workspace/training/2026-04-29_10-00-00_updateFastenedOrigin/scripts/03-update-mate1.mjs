export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'MateUpdateTest' })).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 60, width: 30, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS1', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS2', origin: [30, 15, 10],
    xDirection: [0, 1, 0], yDirection: [0, 0, 1],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1',
    mate1: { path: [inst], csys: wcs1, flip: 'Z', reorient: '0' },
  })).result

  const before = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[03] before — flip:', before.mate1.flip, 'reorient:', before.mate1.reorient, 'csys:', before.mate1.csys)
  filewrite(before, 'before-mate-update')
  await snapshot('before-mate')

  // Update just flip (partial mate1 update)
  const r1 = await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: '-Z' } })
  console.log('[03] update flip only — result:', r1.result, 'maxLevel:', r1.maxLevel)
  const after1 = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[03] after flip — flip:', after1.mate1.flip, 'reorient:', after1.mate1.reorient, 'csys:', after1.mate1.csys)
  console.log('[03] path preserved?', JSON.stringify(after1.mate1.path) === JSON.stringify(before.mate1.path) ? '✓' : '❌')
  filewrite(after1, 'after-flip-update')
  await snapshot('after-flip')

  // Update reorient only
  const r2 = await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { reorient: '90' } })
  console.log('[03] update reorient only — result:', r2.result, 'maxLevel:', r2.maxLevel)
  const after2 = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[03] after reorient — flip:', after2.mate1.flip, 'reorient:', after2.mate1.reorient)
  console.log('[03] flip preserved from last update?', after2.mate1.flip === '-Z' ? '✓' : '❌')
  filewrite(after2, 'after-reorient-update')
  await snapshot('after-reorient')

  // Update csys to WCS2
  const r3 = await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { csys: wcs2 } })
  console.log('[03] update csys — result:', r3.result, 'maxLevel:', r3.maxLevel)
  const after3 = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[03] after csys change — csys:', after3.mate1.csys, '(was', before.mate1.csys, ')')
  filewrite(after3, 'after-csys-update')
  await snapshot('after-csys')

  return { foId }
}
