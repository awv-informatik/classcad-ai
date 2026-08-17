// Does genFixation create a constraint for non-origin points?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FixOffOrigin' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Point NOT at origin, genFixation=TRUE (default)
  const r1 = await api.v1.sketch.point({ id: skId, pos: [50, 30, 0] })
  console.log('[11] off-origin genFixation=TRUE — result:', r1.result, 'maxLevel:', r1.maxLevel)

  const ids = Object.keys(r1.structure.tree).filter(k => +k >= 52).sort((a,b) => +a - +b)
  const nodes = ids.map(id => ({ id: +id, name: r1.structure.tree[id].name, class: r1.structure.tree[id].class }))
  console.log('[11] nodes:', JSON.stringify(nodes))

  filewrite({ result: r1.result, nodes }, 'offorigin-fixation')
  return { partId, skId }
}
