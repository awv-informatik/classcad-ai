// Test basic updateWorkPoint — change position of USERDEFINED work point
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UWPTest' })).result

  // Create a USERDEFINED work point
  const wpId = (await api.v1.part.workPoint({
    id: partId,
    name: 'WP1',
    position: [10, 20, 30]
  })).result
  console.log('[01] created wpId:', wpId)

  // Update position WITHOUT openFeature
  const r1 = await api.v1.part.updateWorkPoint({
    id: wpId,
    position: [60, 50, 40]
  })
  console.log('[01] update without openFeature — result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[01] messages:', JSON.stringify(r1.messages))

  // Now try with openFeature
  const wpId2 = (await api.v1.part.workPoint({
    id: partId,
    name: 'WP2',
    position: [0, 0, 0]
  })).result
  console.log('[01] created wpId2:', wpId2)

  await api.v1.part.openFeature({ id: wpId2 })
  const r2 = await api.v1.part.updateWorkPoint({
    id: wpId2,
    position: [100, 100, 100]
  })
  console.log('[01] update with openFeature — result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[01] messages:', JSON.stringify(r2.messages))
  await api.v1.part.closeFeature({ id: wpId2 })

  filewrite({ withoutOpen: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, withOpen: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages } }, 'position-update')

  return { partId }
}
