export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeExprNames' })).result
  const coneId = (await api.v1.part.cone({
    id: partId, name: 'TestCone', bDiameter: 60, tDiameter: 10, height: 80,
  })).result

  // Try various possible expression names
  const candidates = ['bDiameter', 'tDiameter', 'height', 'bdiameter', 'tdiameter',
    'bottom_diameter', 'top_diameter', 'bottomDiameter', 'topDiameter',
    'BD', 'TD', 'H', 'diameter', 'Diameter', 'Bottom Diameter', 'Top Diameter', 'Height']

  const results = {}
  for (const name of candidates) {
    const r = await api.v1.part.getExpression({ id: coneId, name })
    if (r.result !== null) {
      results[name] = r.result
      console.log(`[16] getExpression('${name}'):`, JSON.stringify(r.result))
    }
  }

  if (Object.keys(results).length === 0) {
    console.log('[16] No expression names matched from candidates')
  }

  // Dump the structure to find the actual expression names
  const r = await api.v1.part.cone({ id: partId, name: 'Dummy' })
  filewrite(r.structure, 'cone-structure')

  return { partId, coneId }
}
