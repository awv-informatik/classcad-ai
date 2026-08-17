export default async function (api, { snapshot, filewrite }) {
  // Create assembly with 3 distinct part templates
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'BoxA' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 20 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'CylB' })).result
  await api.v1.part.cylinder({ id: tplB, name: 'Cyl', height: 30, diameter: 20 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'SphC' })).result
  await api.v1.part.sphere({ id: tplC, name: 'Sph', radius: 12 })
  const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Place instances at distinct positions
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Inst1', transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Inst2', transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Inst3', transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]] })).result

  console.log('[01] asmId:', asmId, 'inst1:', inst1, 'inst2:', inst2, 'inst3:', inst3)

  // Create group with all 3 instances
  const r = await api.v1.assembly.group({ id: asmId, name: 'TestGroup', instanceIds: [inst1, inst2, inst3] })
  console.log('[01] group result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'group-response')

  await snapshot('after-group')

  return { asmId, inst1, inst2, inst3, groupId: r.result }
}
