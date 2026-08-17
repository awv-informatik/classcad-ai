export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylBadRef' })).result

  // Create a work plane (NOT a workCSys)
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'WP1',
    origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0],
  })).result
  console.log('[04] wpId:', wpId)

  // Try cylinder with work plane ID (should fail — only workCSys allowed)
  const r1 = await api.v1.part.cylinder({ id: partId, name: 'BadRefCyl', references: [wpId], diameter: 50, height: 80 })
  console.log('[04] workPlane ref result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] workPlane ref messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'bad-ref-workplane')

  // Try with empty references array (should work — places at origin)
  const r2 = await api.v1.part.cylinder({ id: partId, name: 'EmptyRefCyl', references: [], diameter: 50, height: 80 })
  console.log('[04] empty ref result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'empty-ref')

  return { partId }
}
