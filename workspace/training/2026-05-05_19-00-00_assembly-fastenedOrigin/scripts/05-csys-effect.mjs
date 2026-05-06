export default async function (api, { snapshot, filewrite }) {
  // Test whether csys origin/orientation affects fastenedOrigin positioning
  // (In regular fastened, csys had NO spatial effect)
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })

  // WCS at origin
  const wcsOrigin = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS_Origin', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // WCS at offset [20, 15, 10] (center of box)
  const wcsCenter = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS_Center', origin: [20, 15, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // WCS with rotated axes
  const wcsRotated = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS_Rotated', origin: [0, 0, 0],
    xDirection: [0, 1, 0], yDirection: [-1, 0, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test A: fastenedOrigin with wcsOrigin
  const instA = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'A',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Origin',
    mate1: { path: [instA], csys: wcsOrigin },
  })
  const massA = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05] COG with wcsOrigin:', JSON.stringify(massA?.cog))

  // Test B: new assembly, fastenedOrigin with wcsCenter
  const asmId2 = (await api.v1.assembly.create({})).result
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block2' })).result
  await api.v1.part.box({ id: tpl2, name: 'B2', length: 40, width: 30, height: 20 })
  const wcsC2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS_Center', origin: [20, 15, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId2 })

  const instB = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId2, name: 'B',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId2, name: 'FO_Center',
    mate1: { path: [instB], csys: wcsC2 },
  })
  const massB = (await api.v1.assembly.calculateMassProperties({ id: asmId2 })).result
  console.log('[05] COG with wcsCenter:', JSON.stringify(massB?.cog))

  // Test C: new assembly, fastenedOrigin with wcsRotated
  const asmId3 = (await api.v1.assembly.create({})).result
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Block3' })).result
  await api.v1.part.box({ id: tpl3, name: 'B3', length: 40, width: 30, height: 20 })
  const wcsR3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'WCS_Rotated', origin: [0, 0, 0],
    xDirection: [0, 1, 0], yDirection: [-1, 0, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId3 })

  const instC = (await api.v1.assembly.instance({
    productId: tpl3, ownerId: asmId3, name: 'C',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId3, name: 'FO_Rotated',
    mate1: { path: [instC], csys: wcsR3 },
  })
  const massC = (await api.v1.assembly.calculateMassProperties({ id: asmId3 })).result
  console.log('[05] COG with wcsRotated:', JSON.stringify(massC?.cog))

  filewrite({
    cogWcsOrigin: massA?.cog,
    cogWcsCenter: massB?.cog,
    cogWcsRotated: massC?.cog,
  }, 'csys-comparison')

  return {}
}
