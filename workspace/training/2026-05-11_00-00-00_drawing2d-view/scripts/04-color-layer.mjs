export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ColorLayer' })).result
  await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })

  // Test with explicit color and layer
  const r1 = await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'], color: 1, layer: '3' })
  console.log('[04] color=1 layer="3" result:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'color-layer-response')

  // Check structure for color/layer data
  const tree = r1.structure.tree
  for (const [nid, node] of Object.entries(tree)) {
    if (node.class === 'CC_View2D') {
      console.log('[04] view', nid, 'name:', node.name, 'all keys:', Object.keys(node).join(', '))
      // Print all non-children properties
      for (const [k, v] of Object.entries(node)) {
        if (k !== 'children' && typeof v !== 'object') {
          console.log('[04]   ', k, ':', v)
        }
      }
    }
  }

  // Test with color=256 (default layer color) and color=0 (default)
  const r2 = await api.v1.drawing2d.view({ id: partId, types: ['TOP'], color: 256 })
  console.log('[04] color=256 result:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.drawing2d.view({ id: partId, types: ['TOP'], color: 0 })
  console.log('[04] color=0 result:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  // Test with invalid color
  const r4 = await api.v1.drawing2d.view({ id: partId, types: ['TOP'], color: 999 })
  console.log('[04] color=999 (invalid) result:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)
  if (r4.messages.length > 0) {
    console.log('[04] messages:', JSON.stringify(r4.messages))
  }

  return { partId }
}
