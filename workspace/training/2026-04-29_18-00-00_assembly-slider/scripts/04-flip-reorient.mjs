export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FlipAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tpl1, name: 'Body', length: 80, width: 30, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ax1', origin: [40, 15, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Blk', length: 20, width: 15, height: 40 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ax2', origin: [10, 7.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  // flip: 'X' — slide axis along X instead of Z
  const r1 = await api.v1.assembly.slider({
    id: asmId, name: 'FlipX',
    mate1: { path: [inst1], csys: wcs1, flip: 'X' },
    mate2: { path: [inst2], csys: wcs2, flip: 'X' },
  })
  console.log('[04] flip X result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'flip-x')
  await snapshot('flip-x')

  // flip: '-Z' — inverted Z
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Block2' })).result
  await api.v1.part.box({ id: tpl3, name: 'Blk2', length: 18, width: 14, height: 35 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'Ax3', origin: [9, 7, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId })).result

  const r2 = await api.v1.assembly.slider({
    id: asmId, name: 'FlipNegZ',
    mate1: { path: [inst1], csys: wcs1, flip: '-Z' },
    mate2: { path: [inst3], csys: wcs3, flip: '-Z' },
  })
  console.log('[04] flip -Z result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'flip-neg-z')
  await snapshot('flip-neg-z')

  // reorient: '90'
  const tpl4 = (await api.v1.assembly.partTemplate({ name: 'Block3' })).result
  await api.v1.part.box({ id: tpl4, name: 'Blk3', length: 25, width: 10, height: 30 })
  const wcs4 = (await api.v1.part.workCSys({
    id: tpl4, name: 'Ax4', origin: [12.5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst4 = (await api.v1.assembly.instance({ productId: tpl4, ownerId: asmId })).result

  const r3 = await api.v1.assembly.slider({
    id: asmId, name: 'Reorient90',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst4], csys: wcs4, reorient: '90' },
  })
  console.log('[04] reorient 90 result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'reorient-90')
  await snapshot('reorient-90')

  // Invalid flip value
  const tpl5 = (await api.v1.assembly.partTemplate({ name: 'Block4' })).result
  await api.v1.part.box({ id: tpl5, name: 'Blk4', length: 15, width: 15, height: 20 })
  const wcs5 = (await api.v1.part.workCSys({
    id: tpl5, name: 'Ax5', origin: [7.5, 7.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst5 = (await api.v1.assembly.instance({ productId: tpl5, ownerId: asmId })).result

  const r4 = await api.v1.assembly.slider({
    id: asmId, name: 'BadFlip',
    mate1: { path: [inst1], csys: wcs1, flip: 'INVALID' },
    mate2: { path: [inst5], csys: wcs5 },
  })
  console.log('[04] invalid flip result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[04] invalid flip messages:', JSON.stringify(r4.messages))
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'invalid-flip')

  // Invalid reorient value
  const r5 = await api.v1.assembly.slider({
    id: asmId, name: 'BadReorient',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst5], csys: wcs5, reorient: '45' },
  })
  console.log('[04] invalid reorient result:', r5.result, 'maxLevel:', r5.maxLevel)
  console.log('[04] invalid reorient messages:', JSON.stringify(r5.messages))
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'invalid-reorient')

  return { asmId }
}
