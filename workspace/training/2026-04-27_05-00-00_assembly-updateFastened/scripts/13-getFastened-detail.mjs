export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS1', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 20, width: 20, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Block' })).result

  // Create two constraints
  const c1 = (await api.v1.assembly.fastened({
    id: asmId, name: 'First',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 10,
  })).result

  // Use inst2 as a third instance for a second constraint
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Small' })).result
  await api.v1.part.box({ id: tpl3, name: 'Box3', length: 10, width: 10, height: 10 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'WCS3', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'Small' })).result

  const c2 = (await api.v1.assembly.fastened({
    id: asmId, name: 'Second',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
    yOffset: 30,
  })).result

  // Test getFastened by name
  const g1 = await api.v1.assembly.getFastened({ id: asmId, name: 'First' })
  console.log('[13] getFastened "First":', g1.result?.id, 'maxLevel:', g1.maxLevel)
  filewrite(g1, 'get-first')

  const g2 = await api.v1.assembly.getFastened({ id: asmId, name: 'Second' })
  console.log('[13] getFastened "Second":', g2.result?.id, 'maxLevel:', g2.maxLevel)
  filewrite(g2, 'get-second')

  // Test getFastened with non-existent name
  const gBad = await api.v1.assembly.getFastened({ id: asmId, name: 'NonExistent' })
  console.log('[13] getFastened bad name:', gBad.result, 'maxLevel:', gBad.maxLevel)
  filewrite({ result: gBad.result, messages: gBad.messages, maxLevel: gBad.maxLevel }, 'get-nonexistent')

  // Test getFastened with instance ID instead of assembly ID
  const gInst = await api.v1.assembly.getFastened({ id: inst1, name: 'First' })
  console.log('[13] getFastened via instance:', gInst.result?.id, 'maxLevel:', gInst.maxLevel)
  filewrite({ result: gInst.result, messages: gInst.messages, maxLevel: gInst.maxLevel }, 'get-via-instance')

  // Full return structure analysis
  console.log('[13] return keys:', Object.keys(g1.result || {}))
  console.log('[13] mate1 keys:', Object.keys(g1.result?.mate1 || {}))
  console.log('[13] mate2 keys:', Object.keys(g1.result?.mate2 || {}))

  return { c1, c2 }
}
