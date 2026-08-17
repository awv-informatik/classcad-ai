// Realistic usage: point + line, test genIncidence with line endpoints
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PointLineMix' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line
  const lineR = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  console.log('[19] line:', lineR.result)

  // Create a point at the line's endpoint — does genIncidence create coincidence?
  const ptR = await api.v1.sketch.point({ id: skId, pos: [50, 0, 0] })
  console.log('[19] point at line end:', ptR.result, 'maxLevel:', ptR.maxLevel)

  // Check for coincidence constraint between point and line endpoint
  const ids = Object.keys(ptR.structure.tree).filter(k => +k >= 52).sort((a,b) => +a - +b)
  const nodes = ids.map(id => ({ id: +id, name: ptR.structure.tree[id].name, class: ptR.structure.tree[id].class }))
  console.log('[19] nodes:', JSON.stringify(nodes))

  filewrite(nodes, 'point-line-nodes')
  await snapshot('point-at-line-end')
  return { partId, skId }
}
