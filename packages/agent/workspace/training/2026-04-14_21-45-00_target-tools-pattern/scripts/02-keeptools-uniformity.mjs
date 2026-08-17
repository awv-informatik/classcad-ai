// Test: Does keepTools=true preserve tool IDs across all 4 operations?
// After each op with keepTools=true, attempt to translate the tool (proves ID is valid)
// Then test keepTools=false — attempt to use consumed tool (expect error)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'KeepToolsTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const results = {}

  // Helper: create two boxes
  async function makePair() {
    const a = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
    const b = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result
    return [a, b]
  }

  // --- keepTools: true across all 4 ---
  for (const op of ['union', 'subtraction', 'intersection', 'merge']) {
    const [target, tool] = await makePair()
    const r = await api.v1.solid[op]({ id: eifId, target, tools: [tool], keepTools: true })
    // Try to translate the tool — should succeed if keepTools preserved it
    const moveR = await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 0, 100] })
    results[`${op}_keepTrue`] = {
      opMaxLevel: r.maxLevel,
      toolAlive: moveR.maxLevel <= 31,
      moveMaxLevel: moveR.maxLevel
    }
    console.log(`[02] ${op} keepTools=true: tool alive=${moveR.maxLevel <= 31}, moveMaxLevel=${moveR.maxLevel}`)
  }

  // --- keepTools: false (default) across all 4 ---
  for (const op of ['union', 'subtraction', 'intersection', 'merge']) {
    const [target, tool] = await makePair()
    const r = await api.v1.solid[op]({ id: eifId, target, tools: [tool] }) // keepTools defaults false
    // Try to translate the consumed tool — should fail
    const moveR = await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 0, 100] })
    results[`${op}_keepFalse`] = {
      opMaxLevel: r.maxLevel,
      toolAlive: moveR.maxLevel <= 31,
      moveMaxLevel: moveR.maxLevel,
      moveMessages: moveR.messages
    }
    console.log(`[02] ${op} keepTools=false: tool alive=${moveR.maxLevel <= 31}, moveMaxLevel=${moveR.maxLevel}`)
  }

  filewrite(results, 'keeptools-results')
  return { partId }
}
