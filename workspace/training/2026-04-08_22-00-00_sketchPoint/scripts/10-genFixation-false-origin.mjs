// Clean test: genFixation=FALSE for a point at origin (single part)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoFixOrigin' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[10] partId:', partId, 'skId:', skId)

  // Create point at origin with genFixation=FALSE (try JS false)
  const r1 = await api.v1.sketch.point({ id: skId, pos: [0, 0, 0], genFixation: false })
  console.log('[10] genFixation=false — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] messages:', JSON.stringify(r1.messages))

  // List all sketch nodes
  const ids = Object.keys(r1.structure.tree).filter(k => +k >= 52).sort((a,b) => +a - +b)
  const nodes = ids.map(id => ({ id: +id, name: r1.structure.tree[id].name, class: r1.structure.tree[id].class }))
  console.log('[10] nodes:', JSON.stringify(nodes))

  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel, nodes }, 'genFixation-false-origin')
  return { partId, skId }
}
