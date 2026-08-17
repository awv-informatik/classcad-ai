// Dump the graphic data structure to understand its format
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DumpGraphic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxR = await api.v1.solid.box({
    id: eifId,
    length: 80,
    width: 40,
    height: 30,
    translation: [20, 10, 0],
  })
  const boxId = boxR.result
  console.log('[04] boxId:', boxId)

  // Dump graphic top-level keys
  if (boxR.graphic) {
    const keys = Object.keys(boxR.graphic)
    console.log('[04] graphic keys:', keys.join(', '))
    // Dump a subset — avoid huge arrays
    for (const key of keys) {
      const val = boxR.graphic[key]
      if (Array.isArray(val)) {
        console.log(`[04] graphic.${key}: Array(${val.length})`)
        if (val.length > 0 && typeof val[0] === 'object') {
          console.log(`[04]   first item keys:`, Object.keys(val[0]).join(', '))
        }
      } else if (typeof val === 'object' && val !== null) {
        console.log(`[04] graphic.${key}: Object { ${Object.keys(val).join(', ')} }`)
      } else {
        console.log(`[04] graphic.${key}:`, val)
      }
    }
  } else {
    console.log('[04] graphic is null/undefined')
  }

  // Also dump structure top-level
  if (boxR.structure) {
    const keys = Object.keys(boxR.structure)
    console.log('[04] structure keys:', keys.join(', '))
  }

  // Write trimmed graphic to file
  if (boxR.graphic) {
    // Write just the first body's data, truncating big arrays
    const g = boxR.graphic
    const summary = {}
    for (const key of Object.keys(g)) {
      const val = g[key]
      if (Array.isArray(val)) {
        summary[key] = { type: 'array', length: val.length }
        if (val.length > 0 && typeof val[0] === 'object') {
          summary[key].firstItemKeys = Object.keys(val[0])
          // Show first item with truncated arrays
          const firstItem = {}
          for (const [k, v] of Object.entries(val[0])) {
            if (Array.isArray(v) && v.length > 20) {
              firstItem[k] = { type: 'array', length: v.length, first10: v.slice(0, 10) }
            } else {
              firstItem[k] = v
            }
          }
          summary[key].firstItem = firstItem
        }
      } else {
        summary[key] = val
      }
    }
    filewrite(summary, 'graphic-summary')
  }

  return { partId, eifId, boxId }
}
