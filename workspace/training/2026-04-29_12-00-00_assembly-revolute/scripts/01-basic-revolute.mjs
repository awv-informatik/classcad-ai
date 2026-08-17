export default async function (api, { snapshot, filewrite }) {
  // Create assembly
  const asmId = (await api.v1.assembly.create({ name: 'RevoluteTest' })).result
  console.log('[01] asmId:', asmId)

  // Template 1: base plate (wide, flat)
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'HingeAxis', origin: [40, 0, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[01] tpl1:', tpl1, 'wcs1:', wcs1)

  // Template 2: arm (tall, narrow)
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Arm', length: 15, width: 50, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'HingeAxis', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[01] tpl2:', tpl2, 'wcs2:', wcs2)

  // Switch to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances
  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmInst',
  })).result
  console.log('[01] inst1:', inst1, 'inst2:', inst2)

  // Snapshot before constraint
  await snapshot('before')

  // Create revolute constraint — hinge arm to base
  const r = await api.v1.assembly.revolute({
    id: asmId,
    name: 'Hinge1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[01] revolute result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'revolute-response')

  // Snapshot after constraint
  await snapshot('after')

  return { asmId, inst1, inst2, constraintId: r.result }
}
