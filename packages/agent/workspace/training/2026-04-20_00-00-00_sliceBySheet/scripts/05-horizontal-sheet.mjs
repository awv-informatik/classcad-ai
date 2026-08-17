export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'HorizontalSheet' })).result

  // Box: 80x60x50 at origin
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result

  // Reference cylinder (for visual scale)
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Ref', radius: 5, height: 80, translation: [-20, 30, 0],
  })).result

  // Sheet on Front (XZ) plane: rectangle positioned so bottom edge at z=20
  // passes through the box horizontally. Other edges outside the box.
  const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result

  // On XZ plane: x is horizontal, z (mapped to sketch Y) is vertical
  // Rectangle bottom at z=20, top at z=200 (outside box)
  // Left at x=-20 (outside box), right at x=100 (outside box)
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-20, 20, 0], endPos: [100, 200, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Extrude along Y (perpendicular to XZ) to span the box
  const sheetId = (await api.v1.part.extrusion({
    id: partId, name: 'CuttingSheet', references: [regionId],
    type: 'UP', limit2: 80, capEnds: 0,
  })).result

  console.log('[05] boxId:', boxId, 'cylId:', cylId, 'sheetId:', sheetId)
  await snapshot('before')

  const r = await api.v1.part.sliceBySheet({
    id: partId,
    target: boxId,
    tool: sheetId,
  })
  console.log('[05] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  await snapshot('after')

  // Check body type in structure
  filewrite(r.structure, 'after-structure')

  // Check if result is solid by trying boolean
  const testBox = (await api.v1.part.box({
    id: partId, name: 'TestBox', length: 5, width: 5, height: 5, translation: [0, 0, 60],
  })).result
  const boolR = await api.v1.part.boolean({
    id: partId, type: 'UNION', target: r.result, tools: [testBox],
  })
  console.log('[05] boolean test result:', boolR.result, 'maxLevel:', boolR.maxLevel)
  if (boolR.messages?.length) console.log('[05] bool msgs:', JSON.stringify(boolR.messages?.map(m => m.message)))

  return { partId, sliceId: r.result }
}
