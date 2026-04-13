// Does fillet work only with lines? Try passing a circle ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletNonLine' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line and a circle
  const l1 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const circ = await api.v1.sketch.circle({ id: skId, centerPos: [50, 0, 0], radius: 20 })
  console.log('[18] line:', l1.result, 'circle:', circ.result)

  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [l1.result, circ.result], offset: 5 })
  console.log('[18] fillet line+circle result:', JSON.stringify(r.result))
  console.log('[18] maxLevel:', r.maxLevel)
  console.log('[18] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'fillet-nonline-response')

  return { partId }
}
