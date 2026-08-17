export default async function (api, { snapshot, filewrite }) {
  // Create assembly with 3 part templates
  const asmId = (await api.v1.assembly.create({ name: 'GroupTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 30, width: 20, height: 15 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Part2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'Cyl', height: 20, diameter: 15 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Part3' })).result
  await api.v1.part.sphere({ id: tpl3, name: 'Sph', radius: 10 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'I2',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl3, ownerId: asmId, name: 'I3',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[01] asmId:', asmId, 'inst1:', inst1, 'inst2:', inst2, 'inst3:', inst3)

  // Fasten inst1 at origin
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 },
  })

  // Create a group with all 3 instances
  const r = await api.v1.assembly.group({
    id: asmId,
    name: 'TestGroup',
    instanceIds: [inst1, inst2, inst3],
  })
  console.log('[01] group result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'group-response')

  // Create a second group with just 2 instances
  const r2 = await api.v1.assembly.group({
    id: asmId,
    instanceIds: [inst1, inst2],
  })
  console.log('[01] group2 (default name) result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'group2-response')

  await snapshot('basic-group')
  return { asmId, inst1, inst2, inst3, groupId: r.result, group2Id: r2.result }
}
