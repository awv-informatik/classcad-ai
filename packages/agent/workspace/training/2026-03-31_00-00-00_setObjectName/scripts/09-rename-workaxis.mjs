// 09 — Rename a work axis and verify
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WA_Test' })).result
  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'OrigAxis', origin: [0, 0, 0], direction: [0, 1, 0]
  })).result
  console.log('[09] partId:', partId, 'waId:', waId)

  // Rename
  const r = await api.v1.common.setObjectName({ id: waId, name: 'NewAxis' })
  console.log('[09] rename result:', r.result, 'maxLevel:', r.maxLevel)

  // Try getWorkGeometry with new name
  const lookup = await api.v1.part.getWorkGeometry({ id: partId, name: 'NewAxis' })
  console.log('[09] getWorkGeometry("NewAxis"):', lookup.result, 'maxLevel:', lookup.maxLevel)

  filewrite({ renameMaxLevel: r.maxLevel, lookupResult: lookup.result, lookupMaxLevel: lookup.maxLevel }, 'workaxis-rename')

  return { partId, waId }
}
