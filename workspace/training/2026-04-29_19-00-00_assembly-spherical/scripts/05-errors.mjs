export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ErrorTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 60, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Socket', origin: [40, 30, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Joint', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  const errors = []

  // Self-constraint
  const r1 = await api.v1.assembly.spherical({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[05] self-constraint:', r1.result, 'maxLevel:', r1.maxLevel)
  errors.push({ test: 'self-constraint', result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages })

  // Invalid flip
  const r2 = await api.v1.assembly.spherical({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1, flip: 'INVALID' },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[05] invalid flip:', r2.result, 'maxLevel:', r2.maxLevel)
  errors.push({ test: 'invalid-flip', result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages })

  // Invalid reorient
  const r3 = await api.v1.assembly.spherical({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1, reorient: '45' },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[05] invalid reorient:', r3.result, 'maxLevel:', r3.maxLevel)
  errors.push({ test: 'invalid-reorient', result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages })

  // Template ID in path (should fail)
  const r4 = await api.v1.assembly.spherical({
    id: asmId,
    mate1: { path: [tpl1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[05] template in path:', r4.result, 'maxLevel:', r4.maxLevel)
  errors.push({ test: 'template-in-path', result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages })

  // Empty yRotationLimits object
  const r5 = await api.v1.assembly.spherical({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    yRotationLimits: {},
  })
  console.log('[05] empty yRotationLimits:', r5.result, 'maxLevel:', r5.maxLevel)
  errors.push({ test: 'empty-limits', result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages })

  // Negative yRotationLimits.max
  const r6 = await api.v1.assembly.spherical({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    yRotationLimits: { max: -1 },
  })
  console.log('[05] negative limits.max:', r6.result, 'maxLevel:', r6.maxLevel)
  errors.push({ test: 'negative-max', result: r6.result, maxLevel: r6.maxLevel, messages: r6.messages })

  filewrite(errors, 'all-errors')
  return { asmId }
}
