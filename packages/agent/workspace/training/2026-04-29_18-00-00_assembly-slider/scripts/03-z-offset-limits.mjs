export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ZLimitAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tpl1, name: 'Body', length: 100, width: 20, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ax1', origin: [50, 10, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Blk', length: 20, width: 20, height: 15 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ax2', origin: [10, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  // Full zOffsetLimits (min and max)
  const r1 = await api.v1.assembly.slider({
    id: asmId, name: 'FullLimits',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffsetLimits: { min: -30, max: 40 },
  })
  console.log('[03] full limits result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'full-limits')

  // Partial: min only
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Block2' })).result
  await api.v1.part.box({ id: tpl3, name: 'Blk2', length: 15, width: 15, height: 12 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'Ax3', origin: [7.5, 7.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId })).result

  const r2 = await api.v1.assembly.slider({
    id: asmId, name: 'MinOnly',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
    zOffsetLimits: { min: -20 },
  })
  console.log('[03] min-only limits result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'min-only-limits')

  // Partial: max only
  const tpl4 = (await api.v1.assembly.partTemplate({ name: 'Block3' })).result
  await api.v1.part.box({ id: tpl4, name: 'Blk3', length: 12, width: 12, height: 10 })
  const wcs4 = (await api.v1.part.workCSys({
    id: tpl4, name: 'Ax4', origin: [6, 6, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst4 = (await api.v1.assembly.instance({ productId: tpl4, ownerId: asmId })).result

  const r3 = await api.v1.assembly.slider({
    id: asmId, name: 'MaxOnly',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst4], csys: wcs4 },
    zOffsetLimits: { max: 50 },
  })
  console.log('[03] max-only limits result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'max-only-limits')

  // Edge case: empty zOffsetLimits
  const tpl5 = (await api.v1.assembly.partTemplate({ name: 'Block4' })).result
  await api.v1.part.box({ id: tpl5, name: 'Blk4', length: 10, width: 10, height: 8 })
  const wcs5 = (await api.v1.part.workCSys({
    id: tpl5, name: 'Ax5', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst5 = (await api.v1.assembly.instance({ productId: tpl5, ownerId: asmId })).result

  const r4 = await api.v1.assembly.slider({
    id: asmId, name: 'EmptyLimits',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst5], csys: wcs5 },
    zOffsetLimits: {},
  })
  console.log('[03] empty limits result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[03] empty limits messages:', JSON.stringify(r4.messages))
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'empty-limits')

  await snapshot('z-offset-limits')
  return { asmId }
}
