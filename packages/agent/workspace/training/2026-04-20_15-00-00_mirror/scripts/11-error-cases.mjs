export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorErrors' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1', length: 40, width: 30, height: 50,
  })).result

  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result

  // Test 1: Empty targets
  const r1 = await api.v1.part.mirror({
    id: partId,
    targets: [],
    references: [rightWp],
  })
  console.log('[11] empty targets:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[11] empty targets msgs:', JSON.stringify(r1.messages))

  // Test 2: Empty references
  const r2 = await api.v1.part.mirror({
    id: partId,
    targets: [boxId],
    references: [],
  })
  console.log('[11] empty refs:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[11] empty refs msgs:', JSON.stringify(r2.messages))

  // Test 3: Invalid target ID
  const r3 = await api.v1.part.mirror({
    id: partId,
    targets: [99999],
    references: [rightWp],
  })
  console.log('[11] bad target:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[11] bad target msgs:', JSON.stringify(r3.messages))

  // Test 4: Missing targets param entirely
  try {
    const r4 = await api.v1.part.mirror({
      id: partId,
      references: [rightWp],
    })
    console.log('[11] no targets param:', r4.result, 'maxLevel:', r4.maxLevel)
    if (r4.messages?.length) console.log('[11] no targets msgs:', JSON.stringify(r4.messages))
  } catch (e) {
    console.log('[11] no targets threw:', e.message)
  }

  filewrite({
    emptyTargets: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    emptyRefs: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    badTarget: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'error-cases')

  return { partId }
}
