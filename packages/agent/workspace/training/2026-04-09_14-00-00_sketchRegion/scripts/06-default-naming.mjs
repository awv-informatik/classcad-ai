// Check default naming convention when no name is provided — use structure tree
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NamingTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect1 = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [30, 20, 0] })
  const rect2 = await api.v1.sketch.rectangle({ id: skId, startPos: [50, 0, 0], endPos: [80, 20, 0] })

  // Create regions without explicit names
  const r1 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect1.result })
  const r2 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect2.result })
  console.log('[06] region1 id:', r1.result, 'region2 id:', r2.result)

  // Extract names from structure tree
  const name1 = r2.structure?.tree?.[r1.result]?.name
  const name2 = r2.structure?.tree?.[r2.result]?.name
  console.log('[06] auto name 1:', name1)
  console.log('[06] auto name 2:', name2)

  // Try getSketchRegion with the auto-generated name
  if (name1) {
    const found = await api.v1.sketch.getSketchRegion({ id: skId, name: name1 })
    console.log('[06] getSketchRegion by auto name:', found.result, '(match:', found.result === r1.result, ')')
  }

  filewrite({
    region1: { id: r1.result, name: name1 },
    region2: { id: r2.result, name: name2 },
  }, 'default-names')

  return { partId }
}
