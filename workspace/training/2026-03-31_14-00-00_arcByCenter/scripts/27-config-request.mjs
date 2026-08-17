// 27 — Debug: use raw client request to send Configuration toggle
// This tests what renderSession could do with its client.request access
export default async function ({ v1: apiV1 }, { snapshot, filewrite }, client) {
  // The harness doesn't pass the client to scripts — but we can modify renderSession directly
  // For now, let's just verify the current rendering behavior by making a clean test case
  // and examining what snapshot() produces vs what we'd want

  // Let me instead try a different approach:
  // Create each curve in its own shape, so each gets graphic data
  await apiV1.common.setDatabaseSettings({ doCurveTessellation: true })

  const partId = (await apiV1.part.create({ name: 'ArcTest' })).result
  const eifId = (await apiV1.part.entityInjection({ id: partId })).result

  // Shape 1: line
  const s1 = (await apiV1.curve.shape({ id: eifId, name: 'Line1' })).result
  const r1 = await apiV1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  console.log('[27] s1 line graphic?:', r1.graphic != null)

  // Shape 2: arc
  const s2 = (await apiV1.curve.shape({ id: eifId, name: 'Arc1' })).result
  const r2 = await apiV1.curve.arcByCenter({
    id: s2, centerPos: [50, 15, 0], startPos: [50, 0, 0], endPos: [65, 15, 0], isClockwise: false,
  })
  console.log('[27] s2 arc graphic?:', r2.graphic != null)

  // Shape 3: line
  const s3 = (await apiV1.curve.shape({ id: eifId, name: 'Line2' })).result
  const r3 = await apiV1.curve.line({ id: s3, startPos: [65, 15, 0], endPos: [65, 40, 0] })
  console.log('[27] s3 line graphic?:', r3.graphic != null)

  // Each shape's first curve should have graphic data
  // The question: does the snapshot renderer merge them all?

  await snapshot('separate-shapes')
  return { partId }
}
