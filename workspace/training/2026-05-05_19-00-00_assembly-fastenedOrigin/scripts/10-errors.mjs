export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'M', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'I1',
  })).result

  const errors = {}

  // Missing id
  const e1 = await api.v1.assembly.fastenedOrigin({
    mate1: { path: [inst], csys: wcs },
  })
  console.log('[10] missing id:', e1.result, 'maxLevel:', e1.maxLevel)
  errors.missingId = { result: e1.result, messages: e1.messages, maxLevel: e1.maxLevel }

  // Missing mate1
  const e2 = await api.v1.assembly.fastenedOrigin({
    id: asmId,
  })
  console.log('[10] missing mate1:', e2.result, 'maxLevel:', e2.maxLevel)
  errors.missingMate1 = { result: e2.result, messages: e2.messages, maxLevel: e2.maxLevel }

  // Invalid csys
  const e3 = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    mate1: { path: [inst], csys: 99999 },
  })
  console.log('[10] bad csys:', e3.result, 'maxLevel:', e3.maxLevel)
  errors.badCsys = { result: e3.result, messages: e3.messages, maxLevel: e3.maxLevel }

  // Invalid flip string
  const e4 = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    mate1: { path: [inst], csys: wcs, flip: 'INVALID' },
  })
  console.log('[10] bad flip:', e4.result, 'maxLevel:', e4.maxLevel)
  errors.badFlip = { result: e4.result, messages: e4.messages, maxLevel: e4.maxLevel }

  // Instance ID instead of assembly root as id
  const e5 = await api.v1.assembly.fastenedOrigin({
    id: inst,
    mate1: { path: [inst], csys: wcs },
  })
  console.log('[10] inst as id:', e5.result, 'maxLevel:', e5.maxLevel)
  errors.instanceAsId = { result: e5.result, messages: e5.messages, maxLevel: e5.maxLevel }

  // Template ID instead of instance in path
  const e6 = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    mate1: { path: [tpl], csys: wcs },
  })
  console.log('[10] tpl in path:', e6.result, 'maxLevel:', e6.maxLevel)
  errors.templateInPath = { result: e6.result, messages: e6.messages, maxLevel: e6.maxLevel }

  // Duplicate constraint on same instance — does it work?
  const fo1 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_First',
    mate1: { path: [inst], csys: wcs },
    xOffset: 50,
  })
  console.log('[10] first constraint:', fo1.result, 'maxLevel:', fo1.maxLevel)

  const fo2 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Second',
    mate1: { path: [inst], csys: wcs },
    xOffset: 100,
  })
  console.log('[10] second constraint on same inst:', fo2.result, 'maxLevel:', fo2.maxLevel)
  errors.duplicateConstraint = { result: fo2.result, messages: fo2.messages, maxLevel: fo2.maxLevel }

  // Where does the instance end up with two constraints?
  if (fo2.result) {
    const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
    console.log('[10] COG with two constraints:', JSON.stringify(mass?.cog))
    errors.dualConstraintCog = mass?.cog
  }

  // Update with invalid constraint ID
  const e7 = await api.v1.assembly.updateFastenedOrigin({ id: 99999, xOffset: 10 })
  console.log('[10] update bad id:', e7.result, 'maxLevel:', e7.maxLevel)
  errors.updateBadId = { result: e7.result, messages: e7.messages, maxLevel: e7.maxLevel }

  filewrite(errors, 'error-results')
  return {}
}
