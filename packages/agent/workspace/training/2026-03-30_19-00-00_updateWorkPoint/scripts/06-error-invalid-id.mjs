// Test error cases: invalid ID, wrong type, missing refs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UWPTest' })).result

  // Error 1: completely invalid ID
  const r1 = await api.v1.part.updateWorkPoint({ id: 'bogus', position: [1, 2, 3] })
  console.log('[06] bogus id — result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[06] messages:', JSON.stringify(r1.messages))

  // Error 2: pass part ID instead of work point ID
  const r2 = await api.v1.part.updateWorkPoint({ id: partId, position: [1, 2, 3] })
  console.log('[06] part id — result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[06] messages:', JSON.stringify(r2.messages))

  // Error 3: invalid type string
  const wpId = (await api.v1.part.workPoint({
    id: partId,
    name: 'WP_err',
    position: [10, 10, 10]
  })).result

  await api.v1.part.openFeature({ id: wpId })
  const r3 = await api.v1.part.updateWorkPoint({ id: wpId, type: 'INVALID_TYPE' })
  console.log('[06] invalid type — result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[06] messages:', JSON.stringify(r3.messages))
  await api.v1.part.closeFeature({ id: wpId })

  // Error 4: change to BREPVERTEX without providing references
  await api.v1.part.openFeature({ id: wpId })
  const r4 = await api.v1.part.updateWorkPoint({ id: wpId, type: 'BREPVERTEX' })
  console.log('[06] BREPVERTEX no refs — result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[06] messages:', JSON.stringify(r4.messages))
  await api.v1.part.closeFeature({ id: wpId })

  filewrite({
    bogusId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    partId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    invalidType: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    noRefs: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }
  }, 'error-cases')

  return { partId }
}
