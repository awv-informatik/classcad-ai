// Capture graphic data from sphere to understand mesh representation
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereGraphic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const r = await api.v1.solid.sphere({ id: eifId, radius: 40 })
  console.log('[11] sphere result:', r.result, 'maxLevel:', r.maxLevel)

  // Analyze graphic data
  if (r.graphic) {
    const summary = {}
    for (const [key, value] of Object.entries(r.graphic)) {
      if (Array.isArray(value)) {
        summary[key] = { type: 'array', length: value.length }
        if (value.length > 0 && typeof value[0] === 'object') {
          summary[key].firstItemKeys = Object.keys(value[0])
        }
      } else if (typeof value === 'object' && value !== null) {
        summary[key] = { type: 'object', keys: Object.keys(value) }
      } else {
        summary[key] = value
      }
    }
    console.log('[11] graphic summary keys:', Object.keys(r.graphic).join(', '))
    filewrite(summary, 'graphic-summary')
  } else {
    console.log('[11] no graphic data returned')
  }

  // Also check structure for sphere-specific info
  if (r.structure) {
    const structSummary = {}
    for (const [key, value] of Object.entries(r.structure)) {
      if (Array.isArray(value)) {
        structSummary[key] = { type: 'array', length: value.length }
      } else {
        structSummary[key] = typeof value
      }
    }
    filewrite(structSummary, 'structure-summary')
  }

  return { partId, eifId, sphereId: r.result }
}
