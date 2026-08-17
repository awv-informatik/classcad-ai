export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Workflow' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // Step 1: Create a box feature as base
  const boxId = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 30 })).result
  console.log('[14] boxId:', boxId)

  await snapshot('base-box')

  // Step 2: Create sketch on top face for a hole
  const sk1 = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const circId = (await api.v1.sketch.circle({ id: sk1, centerPos: [40, 30, 0], radius: 10 })).result
  const region1 = (await api.v1.sketch.sketchRegion({ id: sk1, geomIds: [circId] })).result

  // Extrusion UP through the box (will create a boss on top)
  const ext1 = await api.v1.part.extrusion({
    id: partId, name: 'Boss', references: [region1],
    type: 'UP', limit2: 50
  })
  console.log('[14] boss extrusion:', ext1.result, 'maxLevel:', ext1.maxLevel)

  await snapshot('with-boss')

  // Step 3: Second sketch for a slot
  const sk2 = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const slotLines = (await api.v1.sketch.rectangle({ id: sk2, startPos: [10, 20, 0], endPos: [70, 40, 0] })).result
  const region2 = (await api.v1.sketch.sketchRegion({ id: sk2, geomIds: slotLines })).result

  // Can we use extrusion for a subtraction? It should create a separate body
  // The extrusion creates additive geometry by default
  const ext2 = await api.v1.part.extrusion({
    id: partId, name: 'SlotBody', references: [region2],
    type: 'UP', limit2: 35
  })
  console.log('[14] slot extrusion:', ext2.result, 'maxLevel:', ext2.maxLevel)

  await snapshot('multi-feature')

  filewrite({
    box: boxId,
    boss: { result: ext1.result, maxLevel: ext1.maxLevel },
    slot: { result: ext2.result, maxLevel: ext2.maxLevel },
  }, 'workflow')

  return { partId }
}
