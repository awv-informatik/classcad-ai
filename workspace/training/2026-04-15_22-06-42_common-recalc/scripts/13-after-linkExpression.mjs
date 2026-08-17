// Test whether recalc is needed after linkWithExpression
// The source API docs say recalc is needed — prior LLM docs say it's NOT needed. Verify.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkRecalc' })).result

  // Create expression
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 100 }] })

  // Create box with plain height=40
  const boxId = (await api.v1.part.box({ id: partId, length: 60, width: 40, height: 40 })).result
  console.log('[13] boxId:', boxId)

  // Read box height before link
  const expr1 = (await api.v1.part.getExpression({ id: partId, name: 'H' })).result
  console.log('[13] H before link:', JSON.stringify(expr1))

  // Link height to H (WITHOUT recalc)
  const linkR = await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
  console.log('[13] linkWithExpression result:', linkR.result, 'maxLevel:', linkR.maxLevel)

  // Dump structure to check if box height changed immediately
  filewrite(linkR.structure, 'structure-after-link')

  // Now recalc
  const r = await api.v1.common.recalc()
  console.log('[13] recalc result:', r.result, 'maxLevel:', r.maxLevel)

  // Dump structure after recalc
  filewrite(r.structure, 'structure-after-recalc')

  return { linkResult: linkR.result, recalcResult: r.result }
}
