export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ParRemRetry' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref1', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Mover' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref2', origin: [15, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'MoverInst' })).result

  const cId = (await api.v1.assembly.parallel({
    id: asmId,
    name: 'RemTest',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffsetLimits: { min: -10, max: 10 },
    zRotationLimits: { min: 0, max: 1.5708 },
  })).result

  // Try 1: null
  const u1 = await api.v1.assembly.updateParallel({
    id: cId,
    xOffsetLimits: null,
  })
  console.log('[13] null result:', u1.result, 'maxLevel:', u1.maxLevel)
  filewrite({ result: u1.result, messages: u1.messages }, 'try-null')

  // Try 2: empty object {}
  const u2 = await api.v1.assembly.updateParallel({
    id: cId,
    xOffsetLimits: {},
  })
  console.log('[13] empty obj result:', u2.result, 'maxLevel:', u2.maxLevel)
  const g2 = await api.v1.assembly.getParallel({ id: asmId, name: 'RemTest' })
  console.log('[13] after empty obj xOff:', JSON.stringify(g2.result.xOffsetLimits))
  filewrite({ result: u2.result, messages: u2.messages, afterGet: g2.result.xOffsetLimits }, 'try-empty-obj')

  // Try 3: min/max as null
  const u3 = await api.v1.assembly.updateParallel({
    id: cId,
    zRotationLimits: { min: null, max: null },
  })
  console.log('[13] null min/max result:', u3.result, 'maxLevel:', u3.maxLevel)
  const g3 = await api.v1.assembly.getParallel({ id: asmId, name: 'RemTest' })
  console.log('[13] after null min/max zRot:', JSON.stringify(g3.result.zRotationLimits))
  filewrite({ result: u3.result, messages: u3.messages, afterGet: g3.result.zRotationLimits }, 'try-null-minmax')

  return {}
}
