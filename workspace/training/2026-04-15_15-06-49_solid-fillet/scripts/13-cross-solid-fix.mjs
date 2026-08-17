// 13 — Cross-solid fillet (fixed): use solidIndex to get edges from each solid
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossSolidFix' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Two separate boxes side by side
  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 40, width: 30, height: 50,
    translation: [70, 0, 0]
  })).result
  console.log('[13] box1:', box1, 'box2:', box2)

  // Get one edge from solid 0 (box1)
  const edge1R = await api.v1.part.getBrepGeometryByIndex({ id: eifId, solidIndex: 0, lineIndex: 0 })
  console.log('[13] solid0 lineIndex=0:', edge1R.result)

  // Get one edge from solid 1 (box2)
  const edge2R = await api.v1.part.getBrepGeometryByIndex({ id: eifId, solidIndex: 1, lineIndex: 0 })
  console.log('[13] solid1 lineIndex=0:', edge2R.result)

  await snapshot('before')

  // Fillet edges from both solids in one call
  const geomIds = [edge1R.result, edge2R.result].filter(Boolean)
  console.log('[13] geomIds:', JSON.stringify(geomIds))

  if (geomIds.length === 2) {
    const r = await api.v1.solid.fillet({ id: eifId, radius: 5, geomIds })
    console.log('[13] fillet result:', r.result, 'maxLevel:', r.maxLevel)
    if (r.messages?.length) {
      for (const m of r.messages) console.log(`[13] msg: level=${m.level} "${m.message}"`)
    }
    filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'cross-solid-response')

    await snapshot('after')
  } else {
    console.log('[13] ERROR: could not get edges from both solids')
  }

  return { partId, eifId }
}
