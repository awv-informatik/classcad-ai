export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'B1', length: 40, width: 30, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'B2', length: 60, width: 20, height: 15 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'WCS2', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })
  await api.v1.assembly.revolute({
    id: asmId,
    name: 'RealConstraint',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })

  // Test: non-existent name
  const r1 = await api.v1.assembly.getRevolute({ id: asmId, name: 'DOES_NOT_EXIST' })
  console.log('[04] non-existent name result:', r1.result)
  console.log('[04] maxLevel:', r1.maxLevel)
  console.log('[04] messages:', JSON.stringify(r1.messages))

  // Test: empty string name
  const r2 = await api.v1.assembly.getRevolute({ id: asmId, name: '' })
  console.log('[04] empty string name result:', r2.result)
  console.log('[04] maxLevel:', r2.maxLevel)
  console.log('[04] messages:', JSON.stringify(r2.messages))

  // Test: looking for a fastenedOrigin name via getRevolute
  const r3 = await api.v1.assembly.getRevolute({ id: asmId, name: 'FO1' })
  console.log('[04] fastenedOrigin name via getRevolute result:', r3.result)
  console.log('[04] maxLevel:', r3.maxLevel)

  filewrite({
    nonExistent: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    emptyString: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    wrongType: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'not-found')

  return { asmId }
}
