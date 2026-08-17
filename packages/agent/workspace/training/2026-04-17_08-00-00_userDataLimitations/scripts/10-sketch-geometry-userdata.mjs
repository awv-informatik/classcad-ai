export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchGeoUD' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create sketch geometry
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const rectR = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 10, 0], endPos: [30, 30, 0] })
  const rectId = rectR.result

  console.log('[10] lineId:', lineId, 'rectId:', rectId)

  // Try setting user data on sketch geometry elements
  const targets = [
    { name: 'sketch', id: skId },
    { name: 'line', id: lineId },
  ]

  // rectangle returns an array of line IDs — add the first one
  if (Array.isArray(rectId) && rectId.length > 0) {
    targets.push({ name: 'rectLine0', id: rectId[0] })
  } else if (rectId) {
    targets.push({ name: 'rect', id: rectId })
  }

  const results = {}
  for (const t of targets) {
    if (!t.id) {
      console.log('[10]', t.name, ': creation failed, skipping')
      results[t.name] = { error: 'creation failed' }
      continue
    }
    const setR = await api.v1.common.setUserData({ id: t.id, key: 'geoType', value: t.name })
    const getR = await api.v1.common.getUserData({ id: t.id, key: 'geoType' })
    const keysR = await api.v1.common.getUserDataKeys({ id: t.id })
    results[t.name] = {
      id: t.id,
      setMaxLevel: setR.maxLevel,
      setMessages: setR.messages,
      getValue: getR.result,
      keys: keysR.result,
    }
    console.log('[10]', t.name, '(id=' + t.id + '):', setR.maxLevel <= 31 ? '✓' : '❌',
      'get=', getR.result, 'keys=', keysR.result)
  }

  filewrite(results, 'sketch-geo-results')

  return { partId }
}
