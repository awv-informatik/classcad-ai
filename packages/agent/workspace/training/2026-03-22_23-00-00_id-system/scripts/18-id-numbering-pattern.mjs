// Q: Are IDs always even? What's the numbering pattern? Collect a bunch of IDs.
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const ids = [{ name: 'part', id: partId }]

  const boxId = (await api.v1.part.box({ id: partId })).result
  ids.push({ name: 'box', id: boxId })

  const cylId = (await api.v1.part.cylinder({ id: partId })).result
  ids.push({ name: 'cylinder', id: cylId })

  const skId = (await api.v1.sketch.create({ id: partId })).result
  ids.push({ name: 'sketch', id: skId })

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0,0,0], endPos: [100,0,0] })).result
  ids.push({ name: 'line', id: lineId })

  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [50,50,0], radius: 25 })).result
  ids.push({ name: 'circle', id: circId })

  console.log('[18] All IDs:')
  for (const { name, id } of ids) {
    console.log(`[18]   ${name}: ${id} (even: ${id % 2 === 0})`)
  }

  // Check: does the structure tree contain odd IDs?
  const tree = (await api.v1.common.getAppVersion({})).structure?.tree || {}
  const oddIds = Object.values(tree).filter(n => n.id % 2 !== 0)
  console.log('[18] odd IDs in tree:', oddIds.map(n => `${n.id}(${n.class})`).join(', '))

  const allTreeIds = Object.values(tree).map(n => n.id).sort((a,b) => a-b)
  console.log('[18] all tree IDs sorted:', JSON.stringify(allTreeIds))
}
