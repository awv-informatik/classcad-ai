// 06: Identify split segments by examining structure tree, then trim specific ones
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimIdentify' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle + horizontal line through it
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[06] circle:', circle, 'line:', line)

  await snapshot('before')

  // Split
  const splitRes = await api.v1.sketch.splitAllCurves({ id: skId })
  const splitIds = splitRes.result
  console.log('[06] split IDs:', JSON.stringify(splitIds))

  // Examine each split segment in structure tree
  for (const id of splitIds) {
    const key = String(id)
    const node = splitRes.structure?.[key]
    if (node) {
      console.log('[06] id:', id, 'name:', node.name, 'class:', node.class)
      // Look for startPoint/endPoint or position info in members
      const members = node.members || {}
      if (members.startPoint) console.log('[06]   startPoint:', JSON.stringify(members.startPoint.value))
      if (members.endPoint) console.log('[06]   endPoint:', JSON.stringify(members.endPoint.value))
      if (members.centerPoint) console.log('[06]   centerPoint:', JSON.stringify(members.centerPoint.value))
      if (members.radius) console.log('[06]   radius:', members.radius.value)
      if (members.startAngle) console.log('[06]   startAngle:', members.startAngle.value)
      if (members.endAngle) console.log('[06]   endAngle:', members.endAngle.value)
    }
  }

  // Trim the line segment inside the circle (the middle segment)
  // With circle at origin r=30 and line from -60 to 60 on x-axis,
  // line splits into 3: [-60,-30], [-30,30], [30,60]
  // Circle splits into 2 arcs: upper half, lower half

  // Let's trim all segments one by one, snapshotting each time
  for (let i = 0; i < splitIds.length; i++) {
    const id = splitIds[i]
    const key = String(id)
    const node = splitRes.structure?.[key]
    const name = node?.name || 'unknown'

    // Check if the segment still exists (might have been removed by prior trim)
    const trimRes = await api.v1.sketch.trimCurves({ id: skId, curveIds: [id] })
    console.log(`[06] trim id ${id} (${name}): maxLevel=${trimRes.maxLevel}, messages=${JSON.stringify(trimRes.messages)}`)
    await snapshot(`after-trim-${i}-${name}`)
  }

  return { partId }
}
