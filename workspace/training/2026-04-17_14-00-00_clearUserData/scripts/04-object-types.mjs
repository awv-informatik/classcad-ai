export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TypeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: wpId })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  console.log('[04] partId:', partId, 'eifId:', eifId, 'wpId:', wpId, 'skId:', skId, 'lineId:', lineId, 'boxId:', boxId)

  const targets = [
    { name: 'part', id: partId },
    { name: 'eif', id: eifId },
    { name: 'workPlane', id: wpId },
    { name: 'sketch', id: skId },
    { name: 'sketchLine', id: lineId },
    { name: 'solidBox', id: boxId },
  ]

  const results = {}
  for (const t of targets) {
    // Set a key
    const s = await api.v1.common.setUserData({ id: t.id, key: 'tag', value: t.name })
    // Clear it
    const c = await api.v1.common.clearUserData({ id: t.id })
    // Verify cleared
    const keys = (await api.v1.common.getUserDataKeys({ id: t.id })).result
    results[t.name] = {
      setMaxLevel: s.maxLevel,
      clearMaxLevel: c.maxLevel,
      keysAfterClear: keys,
    }
    console.log(`[04] ${t.name} (id=${t.id}): set=${s.maxLevel}, clear=${c.maxLevel}, keys=${JSON.stringify(keys)}`)
  }

  filewrite(results, 'object-types-response')
  return { partId }
}
