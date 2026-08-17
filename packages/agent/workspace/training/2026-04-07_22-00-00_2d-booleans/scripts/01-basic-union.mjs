// 01 — Basic union2d: two overlapping closed rectangles
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: rectangle at origin, 60x40
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Target' })).result
  await api.v1.curve.polyline2d({
    id: s1,
    points: [[0, 0, 0], [60, 0, 0], [60, 40, 0], [0, 40, 0]],
    close: true,
  })

  // Shape 2: rectangle offset by [30, 20], 60x40 — overlapping
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Tool' })).result
  await api.v1.curve.polyline2d({
    id: s2,
    points: [[30, 20, 0], [90, 20, 0], [90, 60, 0], [30, 60, 0]],
    close: true,
  })

  await snapshot('before-union')

  // Perform union
  const r = await api.v1.curve.union2d({ target: s1, tool: s2 })
  console.log('[01] union2d result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'union-response')

  await snapshot('after-union')

  // Check if tool shape (s2) still exists in structure
  const structAfter = r.structure
  const s2Node = structAfter?.tree ? JSON.stringify(structAfter).includes(String(s2)) : 'no tree'
  console.log('[01] s2 ID still in structure:', s2Node)

  // Try to use s1 after union — is it still valid?
  console.log('[01] s1 ID:', s1, 's2 ID:', s2)

  return { partId, s1, s2 }
}
