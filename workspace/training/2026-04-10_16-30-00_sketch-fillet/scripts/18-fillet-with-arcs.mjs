// Does fillet work only with lines, or also with arcs/circles? Docs say "two lines"
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletArc' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line and an arc that share an endpoint
  const l1 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const arc = await api.v1.sketch.arc({ id: skId, centerPos: [50, 20, 0], startPos: [50, 0, 0], endPos: [70, 20, 0] })
  console.log('[18] line:', l1.result, 'arc:', arc.result)

  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [l1.result, arc.result], offset: 5 })
  console.log('[18] fillet line+arc result:', JSON.stringify(r.result))
  console.log('[18] maxLevel:', r.maxLevel)
  console.log('[18] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'fillet-arc-response')

  return { partId }
}
