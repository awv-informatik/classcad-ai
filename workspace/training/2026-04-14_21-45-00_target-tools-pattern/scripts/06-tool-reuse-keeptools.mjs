// Test: Can a single tool be reused across multiple boolean calls with keepTools=true?
// Create one tool, use it in subtraction on body1 (keepTools=true), then on body2, then union on body3
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ToolReuse' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Three target boxes
  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40, translation: [0, 80, 0] })).result
  const box3 = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40, translation: [0, 160, 0] })).result

  // One shared tool
  const tool = (await api.v1.solid.cylinder({ id: eifId, diameter: 25, height: 60, translation: [40, 30, -10] })).result

  // 1. Subtract from box1, keep tool
  const r1 = await api.v1.solid.subtraction({ id: eifId, target: box1, tools: [tool], keepTools: true })
  console.log('[06] sub box1: maxLevel=', r1.maxLevel, 'result=', r1.result)

  // 2. Move tool to box2's location, subtract again, keep tool
  await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 80, 0] })
  const r2 = await api.v1.solid.subtraction({ id: eifId, target: box2, tools: [tool], keepTools: true })
  console.log('[06] sub box2: maxLevel=', r2.maxLevel, 'result=', r2.result)

  // 3. Move tool to box3's location, union this time (last use, consume it)
  await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 80, 0] })
  const r3 = await api.v1.solid.union({ id: eifId, target: box3, tools: [tool] })
  console.log('[06] union box3: maxLevel=', r3.maxLevel, 'result=', r3.result)

  // Verify tool is now consumed
  const rCheck = await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 0, 10] })
  console.log('[06] tool after consume: maxLevel=', rCheck.maxLevel, 'alive=', rCheck.maxLevel <= 31)

  filewrite({
    sub1: { maxLevel: r1.maxLevel },
    sub2: { maxLevel: r2.maxLevel },
    union3: { maxLevel: r3.maxLevel },
    toolConsumed: rCheck.maxLevel > 31
  }, 'reuse-results')

  await snapshot('three-bodies-shared-tool')
  return { partId }
}
