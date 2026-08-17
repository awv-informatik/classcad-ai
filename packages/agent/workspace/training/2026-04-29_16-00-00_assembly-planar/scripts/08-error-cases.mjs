export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PlanarErrors' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result

  const errors = {}

  // Self-constraint (same instance in both mates)
  const r1 = await api.v1.assembly.planar({
    id: asmId,
    name: 'SelfConst',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[08] self-constraint:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[08] self msgs:', JSON.stringify(r1.messages))
  errors.selfConstraint = { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }

  // Missing mate2
  const r2 = await api.v1.assembly.planar({
    id: asmId,
    name: 'NoMate2',
    mate1: { path: [inst1], csys: wcs1 },
  })
  console.log('[08] missing mate2:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[08] no mate2 msgs:', JSON.stringify(r2.messages))
  errors.missingMate2 = { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }

  // Missing id
  const r3 = await api.v1.assembly.planar({
    name: 'NoId',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[08] missing id:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[08] no id msgs:', JSON.stringify(r3.messages))
  errors.missingId = { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }

  // Template ID in path (should fail)
  const r4 = await api.v1.assembly.planar({
    id: asmId,
    name: 'TplInPath',
    mate1: { path: [tpl1], csys: wcs1 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[08] template in path:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[08] tpl path msgs:', JSON.stringify(r4.messages))
  errors.templateInPath = { result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }

  // Empty xOffsetLimits {}
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref', origin: [15, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

  const r5 = await api.v1.assembly.planar({
    id: asmId,
    name: 'EmptyLimits',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffsetLimits: {},
  })
  console.log('[08] empty xOffsetLimits {}:', r5.result, 'maxLevel:', r5.maxLevel)
  if (r5.messages?.length) console.log('[08] empty limits msgs:', JSON.stringify(r5.messages))
  errors.emptyLimits = { result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }

  filewrite(errors, 'error-cases')
  return {}
}
