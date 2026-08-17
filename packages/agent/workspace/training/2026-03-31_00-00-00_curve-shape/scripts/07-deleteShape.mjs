// 07 — deleteShape: delete shapes entirely
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Keep' })).result
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Delete1' })).result
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'Delete2' })).result

  // Add a curve to s2 so we test deletion of non-empty shapes
  await api.v1.curve.line({ id: s2, startPos: [0, 0, 0], endPos: [50, 0, 0] })

  console.log('[07] created shapes:', s1, s2, s3)

  // Delete s2 and s3
  const r = await api.v1.curve.deleteShape({ ids: [s2, s3] })
  console.log('[07] deleteShape result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))

  // Check structure — s1 should remain, s2/s3 should be gone
  const tree = r.structure.tree
  const remaining = [s1, s2, s3].map(id => ({
    id,
    exists: !!tree[String(id)],
    name: tree[String(id)]?.name
  }))
  console.log('[07] remaining:', JSON.stringify(remaining))

  // Check EI children
  const eiNode = tree[String(eifId)]
  const eiChildren = (eiNode?.children || []).map(cid => ({
    id: cid,
    class: tree[String(cid)]?.class,
    name: tree[String(cid)]?.name
  }))
  console.log('[07] EI children after delete:', JSON.stringify(eiChildren))

  filewrite({ deleteResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages }, remaining, eiChildren }, 'deleteShape-result')

  return {}
}
