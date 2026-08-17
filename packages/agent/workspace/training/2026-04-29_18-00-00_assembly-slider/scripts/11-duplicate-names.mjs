export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'DupAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tpl1, name: 'Body', length: 80, width: 20, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ax1', origin: [40, 10, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Blk', length: 20, width: 15, height: 25 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ax2', origin: [10, 7.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Block2' })).result
  await api.v1.part.box({ id: tpl3, name: 'Blk2', length: 15, width: 12, height: 20 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'Ax3', origin: [7.5, 6, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  // Create two sliders with the same name
  const c1 = (await api.v1.assembly.slider({
    id: asmId, name: 'DupName',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  const c2 = (await api.v1.assembly.slider({
    id: asmId, name: 'DupName',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
  })).result

  console.log('[11] slider 1 id:', c1, 'slider 2 id:', c2)
  console.log('[11] duplicates allowed:', c1 !== null && c2 !== null)

  // getSlider with duplicate name — which one returns?
  const r = await api.v1.assembly.getSlider({ id: asmId, name: 'DupName' })
  console.log('[11] getSlider for DupName result id:', r.result?.id)
  console.log('[11] returns first one?', r.result?.id === c1)
  filewrite(r.result, 'dup-name-get')

  // Cross-type name collision: create a fastened with the same name
  const tpl4 = (await api.v1.assembly.partTemplate({ name: 'Block3' })).result
  await api.v1.part.box({ id: tpl4, name: 'Blk3', length: 12, width: 10, height: 18 })
  const wcs4 = (await api.v1.part.workCSys({
    id: tpl4, name: 'Ax4', origin: [6, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst4 = (await api.v1.assembly.instance({ productId: tpl4, ownerId: asmId })).result

  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'CrossType',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst4], csys: wcs4 },
  })).result
  console.log('[11] fastened CrossType id:', fId)

  // Now create a slider with same name
  const tpl5 = (await api.v1.assembly.partTemplate({ name: 'Block4' })).result
  await api.v1.part.box({ id: tpl5, name: 'Blk4', length: 10, width: 10, height: 15 })
  const wcs5 = (await api.v1.part.workCSys({
    id: tpl5, name: 'Ax5', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst5 = (await api.v1.assembly.instance({ productId: tpl5, ownerId: asmId })).result

  const sId = (await api.v1.assembly.slider({
    id: asmId, name: 'CrossType',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst5], csys: wcs5 },
  })).result
  console.log('[11] slider CrossType id:', sId)

  // getSlider should find the slider, not the fastened
  const rCross = await api.v1.assembly.getSlider({ id: asmId, name: 'CrossType' })
  console.log('[11] getSlider CrossType result id:', rCross.result?.id, '=== sliderId?', rCross.result?.id === sId)
  filewrite(rCross.result, 'cross-type-get')

  return { asmId }
}
