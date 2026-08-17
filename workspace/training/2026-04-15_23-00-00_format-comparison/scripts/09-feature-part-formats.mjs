// Compare formats on a parametric feature-based part (not entity injection)
// box feature + expression-driven dims + fillet
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FeaturePart' })).result

  // Named expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 100 },
      { name: 'W', value: 60 },
      { name: 'H', value: 40 },
    ],
  })

  // Create box feature (parametric, not entity injection)
  const boxId = (await api.v1.part.box({
    id: partId,
    length: '@expr.L',
    width: '@expr.W',
    height: '@expr.H',
  })).result

  // Add a fillet
  const filletId = (await api.v1.part.fillet({ id: partId, radius: 5 })).result

  await snapshot('feature-part')
  console.log('[09] partId:', partId, 'boxId:', boxId, 'filletId:', filletId)

  const results = {}
  for (const fmt of ['OFB', 'STP', 'STL', 'SCG', 'IWP']) {
    const r = await api.v1.common.save({ format: fmt, encoding: 'base64' })
    results[fmt] = {
      success: r.result?.success,
      contentLength: r.result?.content?.length || 0,
    }
    console.log(`[09] ${fmt}: b64len=${r.result?.content?.length || 0}`)
  }

  const rDeflate = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  results['OFB_deflate'] = { contentLength: rDeflate.result?.content?.length || 0 }
  console.log(`[09] OFB+deflate: b64len=${rDeflate.result?.content?.length || 0}`)

  // OFB roundtrip to check feature + expression preservation
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  await api.v1.common.clear({})
  const loaded = await api.v1.common.load({ data: saved.result.content, format: 'OFB', encoding: 'base64', compression: 'deflate' })
  const newPartId = loaded.result.id

  // Check expression
  const lAfter = (await api.v1.part.getExpression({ id: newPartId, name: 'L' })).result
  console.log('[09] After OFB roundtrip — L:', JSON.stringify(lAfter))

  // Update expression to verify parametric behavior preserved
  await api.v1.part.updateExpression({ id: newPartId, name: 'L', value: '120' })
  await api.v1.common.recalc()
  const lUpdated = (await api.v1.part.getExpression({ id: newPartId, name: 'L' })).result
  console.log('[09] After update L=120 — L:', JSON.stringify(lUpdated))

  await snapshot('after-roundtrip-update')

  filewrite({
    sizes: results,
    roundtrip: {
      idPreserved: newPartId === partId,
      expressionPreserved: lAfter?.value === 100,
      parametricSurvived: lUpdated?.value === 120,
    },
  }, 'feature-part-formats')

  return { partId: newPartId }
}
