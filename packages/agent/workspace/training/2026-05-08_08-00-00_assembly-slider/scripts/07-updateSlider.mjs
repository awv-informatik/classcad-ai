export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 20, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Rail'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[30, 15, 25], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Create basic slider
  const sliderId = (await api.v1.assembly.slider({
    id: asmId, name: 'Slide1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })).result

  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[07] COG after create:', JSON.stringify(cog1?.cog))
  // X reset to 0 (COG.x=10), Y reset to 0 (COG.y=10), Z preserved at 25 (COG.z=32.5)

  // Update 1: change xOffset to 40
  const r1 = await api.v1.assembly.updateSlider({ id: sliderId, xOffset: 40 })
  console.log('[07] updateSlider xOffset=40:', r1.result, 'maxLevel:', r1.maxLevel)
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[07] COG after xOffset=40:', JSON.stringify(cog2?.cog))

  // Update 2: change yOffset to 20
  const r2 = await api.v1.assembly.updateSlider({ id: sliderId, yOffset: 20 })
  console.log('[07] updateSlider yOffset=20:', r2.result, 'maxLevel:', r2.maxLevel)
  const cog3 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[07] COG after yOffset=20:', JSON.stringify(cog3?.cog))

  // Update 3: add zOffsetLimits
  const r3 = await api.v1.assembly.updateSlider({
    id: sliderId, zOffsetLimits: { min: 10, max: 20 }
  })
  console.log('[07] updateSlider zOffsetLimits:', r3.result, 'maxLevel:', r3.maxLevel)
  const cog4 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[07] COG after zLimits [10,20]:', JSON.stringify(cog4?.cog))
  // Z was ~25, clamped to 20

  // Update 4: rename
  const r4 = await api.v1.assembly.updateSlider({ id: sliderId, name: 'RenamedSlide' })
  console.log('[07] rename:', r4.result, 'maxLevel:', r4.maxLevel)

  // Verify rename with getSlider
  const getOld = await api.v1.assembly.getSlider({ id: asmId, name: 'Slide1' })
  const getNew = await api.v1.assembly.getSlider({ id: asmId, name: 'RenamedSlide' })
  console.log('[07] getSlider old name:', getOld.result, 'new name:', getNew.result?.id)

  // Update 5: remove zOffsetLimits — does Z stay clamped or reset?
  const r5 = await api.v1.assembly.updateSlider({
    id: sliderId, zOffsetLimits: { min: null, max: null }
  })
  console.log('[07] remove zLimits:', r5.result, 'maxLevel:', r5.maxLevel)
  const cog5 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[07] COG after remove limits:', JSON.stringify(cog5?.cog))
  // Hypothesis: Z stays at ~20 (last clamped position), like parallel

  // Error: pass assembly ID instead of constraint ID
  const rErr = await api.v1.assembly.updateSlider({ id: asmId, xOffset: 50 })
  console.log('[07] error (asm ID):', rErr.result, 'maxLevel:', rErr.maxLevel)
  if (rErr.messages?.length) console.log('[07] error msg:', rErr.messages[0]?.message, 'code:', rErr.messages[0]?.code)

  filewrite({
    cogAfterCreate: cog1?.cog,
    cogAfterXOffset: cog2?.cog,
    cogAfterYOffset: cog3?.cog,
    cogAfterZLimits: cog4?.cog,
    cogAfterRemoveLimits: cog5?.cog,
    getOldName: getOld.result,
    getNewName: getNew.result,
    errAsmId: { result: rErr.result, maxLevel: rErr.maxLevel, message: rErr.messages?.[0] }
  }, 'updateSlider-data')

  return { sliderId }
}
