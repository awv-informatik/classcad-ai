export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateNameTest' })).result

  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 30, 0] })).result

  const ccId = (await api.v1.part.compositeCurve({ id: partId, name: 'OldName', references: [l1, l2] })).result
  console.log('[07] initial ccId:', ccId)

  // Update just the name (not references)
  await api.v1.part.openFeature({ id: ccId })
  const r = await api.v1.part.updateCompositeCurve({ id: ccId, name: 'NewName' })
  console.log('[07] updateCompositeCurve (name only) result:', r.result)
  console.log('[07] maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[07] messages:', JSON.stringify(r.messages))
  }
  await api.v1.part.closeFeature({ id: ccId })

  // Check the structure to verify name changed
  const r2 = await api.v1.part.compositeCurve({ id: partId, name: 'Dummy', references: [l1] })
  filewrite(r2.structure, 'structure-after-rename')
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-name-response')

  return { partId, ccId }
}
