export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorCases' })).result
  const box = (await api.v1.part.box({ id: partId, name: 'Box1', length: 20, width: 20, height: 20 })).result

  // Test 1: invalid target ID
  const r1 = await api.v1.part.entityDeletion({ id: partId, name: 'Del1', targets: [99999] })
  console.log('[08] invalid target result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[08] invalid target msg:', r1.messages?.[0]?.message)

  // Test 2: out-of-range index on a single-solid feature
  const r2 = await api.v1.part.entityDeletion({
    id: partId, name: 'Del2',
    targets: [{ id: box, indices: [5] }]
  })
  console.log('[08] out-of-range index result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[08] out-of-range msg:', r2.messages?.[0]?.message)

  // Test 3: empty targets array
  const r3 = await api.v1.part.entityDeletion({ id: partId, name: 'Del3', targets: [] })
  console.log('[08] empty targets result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[08] empty targets msg:', r3.messages?.[0]?.message)

  // Test 4: update without open/close (should fail)
  if (r2.result) {
    const r4 = await api.v1.part.updateEntityDeletion({
      id: r2.result,
      targets: [box]
    })
    console.log('[08] update without open result:', r4.result, 'maxLevel:', r4.maxLevel)
    console.log('[08] update without open msg:', r4.messages?.[0]?.message)
  }

  filewrite({
    invalidTarget: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    outOfRangeIndex: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    emptyTargets: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'error-responses')

  return { partId }
}
