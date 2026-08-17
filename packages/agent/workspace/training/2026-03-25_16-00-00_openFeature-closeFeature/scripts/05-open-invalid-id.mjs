// What happens if you pass an invalid ID to openFeature?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'InvalidId' })).result
  console.log('[05] partId:', partId)

  // Try opening a feature with a bogus ID
  const r1 = await api.v1.part.openFeature({ id: 99999 })
  console.log('[05] openFeature(99999) result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages) {
    for (const m of r1.messages) console.log('[05] msg:', m.level, m.message)
  }

  // Try opening with the part ID instead of a feature ID
  const r2 = await api.v1.part.openFeature({ id: partId })
  console.log('[05] openFeature(partId) result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages) {
    for (const m of r2.messages) console.log('[05] msg:', m.level, m.message)
  }

  return { partId }
}
