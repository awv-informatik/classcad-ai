export default async function (api, { snapshot, filewrite }) {
  // Create assembly with 3 templates + instances: ground, arm1, arm2
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[01] asmId:', asmId)

  // Template A — ground (base plate)
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Template B — arm1 (gear1)
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm1' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 60, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Template C — arm2 (gear2)
  const tplC = (await api.v1.assembly.partTemplate({ name: 'Arm2' })).result
  await api.v1.part.box({ id: tplC, name: 'Box', length: 40, width: 12, height: 6 })
  const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances
  const instBase = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const instArm1 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm1' })).result
  const instArm2 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Arm2' })).result
  console.log('[01] instBase:', instBase, 'instArm1:', instArm1, 'instArm2:', instArm2)

  // Ground the base
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [instBase], csys: wcsA } })

  // Create revolute1: base → arm1
  const rev1 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Rev1',
    mate1: { path: [instBase], csys: wcsA },
    mate2: { path: [instArm1], csys: wcsB },
    zOffset: 10,
  })).result
  console.log('[01] rev1:', rev1)

  // Create revolute2: base → arm2 (offset in X so they don't overlap)
  const rev2 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Rev2',
    mate1: { path: [instBase], csys: wcsA },
    mate2: { path: [instArm2], csys: wcsC },
    zOffset: 10,
  })).result
  console.log('[01] rev2:', rev2)

  await snapshot('before-gear')

  // Create gear relation linking rev1 and rev2 with ratio 2.0
  const gearRes = await api.v1.assembly.gear({
    id: asmId,
    name: 'Gear1',
    constr1Id: rev1,
    constr2Id: rev2,
    ratio: 2.0,
  })
  console.log('[01] gear result:', gearRes.result, 'maxLevel:', gearRes.maxLevel)
  filewrite({ result: gearRes.result, messages: gearRes.messages, maxLevel: gearRes.maxLevel }, 'gear-create-response')

  await snapshot('after-gear')

  return { asmId, rev1, rev2, gearId: gearRes.result, instArm1, instArm2 }
}
