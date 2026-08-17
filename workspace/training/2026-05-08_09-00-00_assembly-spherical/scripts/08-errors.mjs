export default async function (api, { snapshot, filewrite }) {
  // Test error cases
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 40, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 10, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm'
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  const errors = []

  // Error 1: same instance in both mates
  try {
    const e1 = await api.v1.assembly.spherical({
      id: asmId, name: 'Err_SameInst',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst1], csys: wcsA }
    })
    console.log('[08] same-inst result:', e1.result, 'maxLevel:', e1.maxLevel)
    if (e1.messages?.length) console.log('[08] same-inst msgs:', JSON.stringify(e1.messages))
    errors.push({ test: 'same-instance', result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages })
  } catch (e) {
    console.log('[08] same-inst error:', e.message)
    errors.push({ test: 'same-instance', error: e.message })
  }

  // Error 2: missing csys
  try {
    const e2 = await api.v1.assembly.spherical({
      id: asmId, name: 'Err_NoCsys',
      mate1: { path: [inst1] },
      mate2: { path: [inst2], csys: wcsB }
    })
    console.log('[08] no-csys result:', e2.result, 'maxLevel:', e2.maxLevel)
    if (e2.messages?.length) console.log('[08] no-csys msgs:', JSON.stringify(e2.messages))
    errors.push({ test: 'no-csys', result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages })
  } catch (e) {
    console.log('[08] no-csys error:', e.message)
    errors.push({ test: 'no-csys', error: e.message })
  }

  // Error 3: invalid flip value
  try {
    const e3 = await api.v1.assembly.spherical({
      id: asmId, name: 'Err_BadFlip',
      mate1: { path: [inst1], csys: wcsA, flip: 'INVALID' },
      mate2: { path: [inst2], csys: wcsB }
    })
    console.log('[08] bad-flip result:', e3.result, 'maxLevel:', e3.maxLevel)
    if (e3.messages?.length) console.log('[08] bad-flip msgs:', JSON.stringify(e3.messages))
    errors.push({ test: 'bad-flip', result: e3.result, maxLevel: e3.maxLevel, messages: e3.messages })
  } catch (e) {
    console.log('[08] bad-flip error:', e.message)
    errors.push({ test: 'bad-flip', error: e.message })
  }

  // Error 4: template ID in path instead of instance ID
  try {
    const e4 = await api.v1.assembly.spherical({
      id: asmId, name: 'Err_TplPath',
      mate1: { path: [tplA], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB }
    })
    console.log('[08] tpl-path result:', e4.result, 'maxLevel:', e4.maxLevel)
    if (e4.messages?.length) console.log('[08] tpl-path msgs:', JSON.stringify(e4.messages))
    errors.push({ test: 'tpl-in-path', result: e4.result, maxLevel: e4.maxLevel, messages: e4.messages })
  } catch (e) {
    console.log('[08] tpl-path error:', e.message)
    errors.push({ test: 'tpl-in-path', error: e.message })
  }

  // Error 5: instance ID as assembly id
  try {
    const e5 = await api.v1.assembly.spherical({
      id: inst1,
      name: 'Err_InstAsAsm',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB }
    })
    console.log('[08] inst-as-asm result:', e5.result, 'maxLevel:', e5.maxLevel)
    if (e5.messages?.length) console.log('[08] inst-as-asm msgs:', JSON.stringify(e5.messages))
    errors.push({ test: 'inst-as-asm', result: e5.result, maxLevel: e5.maxLevel, messages: e5.messages })
  } catch (e) {
    console.log('[08] inst-as-asm error:', e.message)
    errors.push({ test: 'inst-as-asm', error: e.message })
  }

  // Error 6: updateSpherical with wrong ID (assembly ID instead of constraint ID)
  try {
    const validConstr = (await api.v1.assembly.spherical({
      id: asmId, name: 'Valid',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB }
    })).result

    const e6 = await api.v1.assembly.updateSpherical({
      id: asmId,
      yRotationLimits: { max: 1.0 }
    })
    console.log('[08] asm-id-update result:', e6.result, 'maxLevel:', e6.maxLevel)
    if (e6.messages?.length) console.log('[08] asm-id-update msgs:', JSON.stringify(e6.messages))
    errors.push({ test: 'asm-id-update', result: e6.result, maxLevel: e6.maxLevel, messages: e6.messages })
  } catch (e) {
    console.log('[08] asm-id-update error:', e.message)
    errors.push({ test: 'asm-id-update', error: e.message })
  }

  filewrite(errors, 'errors-data')
  return { asmId }
}
