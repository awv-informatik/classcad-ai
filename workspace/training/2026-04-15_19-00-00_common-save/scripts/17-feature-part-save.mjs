// Save a feature-based part (part.box, not EI+solid.box) — test with parametric content
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FeaturePart' })).result

  // Create expressions
  await api.v1.part.expression({ id: partId, toCreate: [
    { name: 'L', value: 80 },
    { name: 'W', value: 60 },
    { name: 'H', value: 40 },
  ]})

  // Create box feature driven by expressions
  const boxId = (await api.v1.part.box({
    id: partId,
    length: '@expr.L',
    width: '@expr.W',
    height: '@expr.H',
    name: 'MyBox',
  })).result
  console.log('[17] partId:', partId, 'boxId:', boxId)

  await snapshot('feature-part')

  // Save as OFB (should preserve expressions + features)
  const ofb = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  console.log('[17] OFB feature part length:', ofb.result.content?.length)

  // Save as STP (geometry only — expressions lost)
  const stp = await api.v1.common.save({ format: 'STP' })
  console.log('[17] STP feature part length:', stp.result.content?.length)

  // Roundtrip OFB and verify expressions survive
  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({ data: ofb.result.content, format: 'OFB', encoding: 'base64' })
  console.log('[17] load result:', JSON.stringify(loadR.result))

  // Try to read expression after roundtrip
  const exprR = await api.v1.part.getExpression({ id: loadR.result.id, name: 'L' })
  console.log('[17] expr L after roundtrip:', JSON.stringify(exprR.result))
  console.log('[17] expr L maxLevel:', exprR.maxLevel)

  filewrite({
    ofbLength: ofb.result.content?.length,
    stpLength: stp.result.content?.length,
    loadResult: loadR.result,
    exprAfterRoundtrip: exprR.result,
    exprMaxLevel: exprR.maxLevel,
  }, 'feature-part')

  return { partId: loadR.result?.id }
}
