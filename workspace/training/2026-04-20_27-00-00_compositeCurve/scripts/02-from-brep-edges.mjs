export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CompCurveBrepTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  console.log('[02] partId:', partId, 'boxId:', boxId)

  // Find some edge IDs on the box using getGeometryIds
  // Get top-front edge (y=0, z=30, running along x)
  const geo1 = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [30, 0, 30] }] })).result
  // Get top-right edge (x=60, z=30, running along y)
  const geo2 = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [60, 20, 30] }] })).result

  console.log('[02] geo1 lines:', JSON.stringify(geo1.lines))
  console.log('[02] geo2 lines:', JSON.stringify(geo2.lines))

  const edgeIds = [...geo1.lines, ...geo2.lines]
  console.log('[02] edge references:', JSON.stringify(edgeIds))

  // Create composite curve from brep edges
  const r = await api.v1.part.compositeCurve({ id: partId, name: 'CC_Brep', references: edgeIds })
  console.log('[02] compositeCurve result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[02] messages:', JSON.stringify(r.messages))
  }

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel, edgeIds }, 'cc-brep-response')

  await snapshot('composite-from-brep')
  return { partId, boxId, ccId: r.result }
}
