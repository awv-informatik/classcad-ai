export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_Errors' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 30, width: 20, height: 15 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'I1' })).result

  const errors = {}

  // 1. Missing mate1
  try {
    const r1 = await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO_nomate' })
    errors.missingMate1 = { result: r1.result, maxLevel: r1.maxLevel, msg: r1.messages?.[0]?.message }
    console.log('[10] missing mate1:', r1.maxLevel, r1.messages?.[0]?.message)
  } catch (e) {
    errors.missingMate1 = { error: e.message }
    console.log('[10] missing mate1 threw:', e.message)
  }

  // 2. Missing id
  try {
    const r2 = await api.v1.assembly.fastenedOrigin({ mate1: { path: [inst], csys: wcs } })
    errors.missingId = { result: r2.result, maxLevel: r2.maxLevel, msg: r2.messages?.[0]?.message }
    console.log('[10] missing id:', r2.maxLevel, r2.messages?.[0]?.message)
  } catch (e) {
    errors.missingId = { error: e.message }
    console.log('[10] missing id threw:', e.message)
  }

  // 3. Invalid path ID
  try {
    const r3 = await api.v1.assembly.fastenedOrigin({
      id: asmId, mate1: { path: [99999], csys: wcs },
    })
    errors.invalidPath = { result: r3.result, maxLevel: r3.maxLevel, msg: r3.messages?.[0]?.message }
    console.log('[10] invalid path:', r3.maxLevel, r3.messages?.[0]?.message)
  } catch (e) {
    errors.invalidPath = { error: e.message }
    console.log('[10] invalid path threw:', e.message)
  }

  // 4. Template ID in path (not instance)
  try {
    const r4 = await api.v1.assembly.fastenedOrigin({
      id: asmId, mate1: { path: [tpl], csys: wcs },
    })
    errors.templateInPath = { result: r4.result, maxLevel: r4.maxLevel, msg: r4.messages?.[0]?.message }
    console.log('[10] template in path:', r4.maxLevel, r4.messages?.[0]?.message)
  } catch (e) {
    errors.templateInPath = { error: e.message }
    console.log('[10] template in path threw:', e.message)
  }

  // 5. Invalid csys ID
  try {
    const r5 = await api.v1.assembly.fastenedOrigin({
      id: asmId, mate1: { path: [inst], csys: 99999 },
    })
    errors.invalidCsys = { result: r5.result, maxLevel: r5.maxLevel, msg: r5.messages?.[0]?.message }
    console.log('[10] invalid csys:', r5.maxLevel, r5.messages?.[0]?.message)
  } catch (e) {
    errors.invalidCsys = { error: e.message }
    console.log('[10] invalid csys threw:', e.message)
  }

  // 6. Missing csys in mate1
  try {
    const r6 = await api.v1.assembly.fastenedOrigin({
      id: asmId, mate1: { path: [inst] },
    })
    errors.missingCsys = { result: r6.result, maxLevel: r6.maxLevel, msg: r6.messages?.[0]?.message }
    console.log('[10] missing csys:', r6.maxLevel, r6.messages?.[0]?.message)
  } catch (e) {
    errors.missingCsys = { error: e.message }
    console.log('[10] missing csys threw:', e.message)
  }

  // 7. Missing path in mate1
  try {
    const r7 = await api.v1.assembly.fastenedOrigin({
      id: asmId, mate1: { csys: wcs },
    })
    errors.missingPath = { result: r7.result, maxLevel: r7.maxLevel, msg: r7.messages?.[0]?.message }
    console.log('[10] missing path:', r7.maxLevel, r7.messages?.[0]?.message)
  } catch (e) {
    errors.missingPath = { error: e.message }
    console.log('[10] missing path threw:', e.message)
  }

  filewrite(errors, 'error-results')

  return { asmId }
}
