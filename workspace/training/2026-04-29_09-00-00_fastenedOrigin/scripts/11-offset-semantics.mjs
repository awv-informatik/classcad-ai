export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_OffSem' })).result

  // Template with WCS at origin (no offset from template origin)
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'AtOrigin' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 30, width: 20, height: 15 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Template with WCS offset from template origin
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Offset' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box', length: 30, width: 20, height: 15 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [15, 10, 7.5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test 1: WCS at [0,0,0], no offsets → instance at global origin
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Origin_NoOff' })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 },
  })

  // Test 2: WCS at [0,0,0], xOffset=50 → should place instance 50 in X
  const inst2 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Origin_XOff50' })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO2', mate1: { path: [inst2], csys: wcs1 }, xOffset: 50,
  })

  // Test 3: WCS at [15,10,7.5], no offsets → WCS maps to global origin, so instance at [-15,-10,-7.5]
  const inst3 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'WCS_NoOff' })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO3', mate1: { path: [inst3], csys: wcs2 },
  })

  // Test 4: WCS at [15,10,7.5], xOffset=50 → WCS maps to [50,0,0], instance at [50-15, 0-10, 0-7.5]
  const inst4 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'WCS_XOff50' })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO4', mate1: { path: [inst4], csys: wcs2 }, xOffset: 50,
  })

  // Get mass properties to check positions
  const mp1 = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const mp2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  const mp3 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  const mp4 = (await api.v1.assembly.calculateMassProperties({ id: inst4 })).result

  console.log('[11] inst1 CoG:', mp1?.cogX?.toFixed(2), mp1?.cogY?.toFixed(2), mp1?.cogZ?.toFixed(2))
  console.log('[11] inst2 CoG:', mp2?.cogX?.toFixed(2), mp2?.cogY?.toFixed(2), mp2?.cogZ?.toFixed(2))
  console.log('[11] inst3 CoG:', mp3?.cogX?.toFixed(2), mp3?.cogY?.toFixed(2), mp3?.cogZ?.toFixed(2))
  console.log('[11] inst4 CoG:', mp4?.cogX?.toFixed(2), mp4?.cogY?.toFixed(2), mp4?.cogZ?.toFixed(2))

  filewrite({ mp1, mp2, mp3, mp4 }, 'mass-properties')

  await snapshot('offset-semantics')

  return { asmId }
}
