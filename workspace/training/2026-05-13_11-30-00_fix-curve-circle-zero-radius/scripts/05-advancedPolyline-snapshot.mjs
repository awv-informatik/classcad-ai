// Snapshot each case to see what advancedPolyline actually produces for r=0 / r=-5 / r=10.
export default async function (api, { snapshot, filewrite }) {
  async function buildAndSnapshot(label, r) {
    const partId = (await api.v1.part.create({ name: `Adv_${label}` })).result
    const eifId = (await api.v1.part.entityInjection({ id: partId })).result
    const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'P' })).result

    const pld = [
      { xa: 0, ya: 0 },
      { xa: 0, ya: 50 },
      { xa: 50, ya: 50 },
      { xa: 50, ya: 0 },
    ]
    if (r !== null) pld[1].r = r

    const res = await api.v1.curve.advancedPolyline({ id: shapeId, pld, close: true })
    console.log(`[snap] ${label} (r=${r}): maxLevel=${res.maxLevel} messages=${JSON.stringify(res.messages)}`)

    // Extrude so we can render the curve as a solid for visual inspection
    await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 5], curves: [shapeId] })

    await snapshot(label)
    await api.v1.common.clear({})
    return { label, r, res }
  }

  const results = []
  results.push(await buildAndSnapshot('no_r', null))
  results.push(await buildAndSnapshot('r_zero', 0))
  results.push(await buildAndSnapshot('r_negative', -5))
  results.push(await buildAndSnapshot('r_ten', 10))

  filewrite(results, 'snapshot-results')
  return results
}
