// Test: BREPVERTEX — work point at a brep vertex position
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }, { pos: [80, 60, 40] }]
  })
  const v1 = gids.result?.points?.[0]
  const v2 = gids.result?.points?.[1]
  console.log('[02] v1:', v1, 'v2:', v2)

  if (v1) {
    const r = await api.v1.part.workPoint({ id: partId, name: 'WP_brep', type: 'BREPVERTEX', references: [v1] })
    console.log('[02] BREPVERTEX result:', r.result, 'maxLevel:', r.maxLevel)
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'brepvertex')
  }

  // Also try with a work point as reference (should it work?)
  const wpRef = (await api.v1.part.workPoint({ id: partId, name: 'WP_ref', position: [10, 10, 10] })).result
  if (wpRef) {
    const r2 = await api.v1.part.workPoint({ id: partId, name: 'WP_from_wp', type: 'BREPVERTEX', references: [wpRef] })
    console.log('[02] BREPVERTEX(workPoint) result:', r2.result, 'maxLevel:', r2.maxLevel)
    console.log('[02] messages:', JSON.stringify(r2.messages))
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'brepvertex-workpoint')
  }

  return { partId }
}
