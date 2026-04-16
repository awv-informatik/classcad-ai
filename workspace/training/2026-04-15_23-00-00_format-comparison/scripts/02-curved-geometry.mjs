// Test format sizes on curved geometry (sphere + cylinder + boolean)
// Curved surfaces should dramatically increase STL size
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CurvedTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create sphere + cylinder + boolean subtraction (hole through sphere)
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 40 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 100, diameter: 20, translation: [0, 0, -50] })).result
  await api.v1.solid.subtraction({ id: eifId, target: sphId, tools: [cylId] })
  await snapshot('sphere-with-hole')

  const formats = ['OFB', 'STP', 'STL', 'SCG', 'IWP']
  const results = {}

  for (const fmt of formats) {
    const r = await api.v1.common.save({ format: fmt, encoding: 'base64' })
    results[fmt] = {
      success: r.result?.success,
      contentLength: r.result?.content?.length || 0,
    }
    console.log(`[02] ${fmt}: b64len=${r.result?.content?.length || 0}`)
  }

  // OFB compressed
  const rDeflate = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  results['OFB_deflate'] = { contentLength: rDeflate.result?.content?.length || 0 }
  console.log(`[02] OFB+deflate: b64len=${rDeflate.result?.content?.length || 0}`)

  // STL with different faceting tolerances
  for (const tol of [1.0, 0.1, 0.01]) {
    const r = await api.v1.common.save({ format: 'STL', encoding: 'base64', stl: { facetingTol: tol } })
    const key = `STL_tol${tol}`
    results[key] = { contentLength: r.result?.content?.length || 0 }
    console.log(`[02] STL tol=${tol}: b64len=${r.result?.content?.length || 0}`)
  }

  // STL with different angle tolerances
  for (const ang of [30, 6, 1]) {
    const r = await api.v1.common.save({ format: 'STL', encoding: 'base64', stl: { angleTol: ang } })
    const key = `STL_angle${ang}`
    results[key] = { contentLength: r.result?.content?.length || 0 }
    console.log(`[02] STL angleTol=${ang}: b64len=${r.result?.content?.length || 0}`)
  }

  filewrite(results, 'curved-formats')
  return { partId }
}
