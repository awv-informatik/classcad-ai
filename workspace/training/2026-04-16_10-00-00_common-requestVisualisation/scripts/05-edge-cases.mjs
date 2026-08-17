// Test requestVisualisation edge cases: invalid IDs, empty array, nonexistent IDs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisEdge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  // Test with empty IDs array
  try {
    const rEmpty = await api.v1.common.requestVisualisation({ ids: [] })
    console.log('[05] empty ids: result:', rEmpty.result, 'maxLevel:', rEmpty.maxLevel)
    console.log('[05] empty ids: graphic?', !!rEmpty.graphic, 'containers:', rEmpty.graphic?.containers?.length)
  } catch (e) {
    console.log('[05] empty ids: ERROR:', e.message)
  }

  // Test with nonexistent ID
  try {
    const rBad = await api.v1.common.requestVisualisation({ ids: [999999] })
    console.log('[05] bad ID 999999: result:', rBad.result, 'maxLevel:', rBad.maxLevel)
    console.log('[05] bad ID: graphic?', !!rBad.graphic, 'containers:', rBad.graphic?.containers?.length)
    if (rBad.messages.length > 0) {
      console.log('[05] bad ID messages:', JSON.stringify(rBad.messages))
    }
  } catch (e) {
    console.log('[05] bad ID: ERROR:', e.message)
  }

  // Test with zero ID
  try {
    const rZero = await api.v1.common.requestVisualisation({ ids: [0] })
    console.log('[05] zero ID: result:', rZero.result, 'maxLevel:', rZero.maxLevel)
    console.log('[05] zero ID: graphic?', !!rZero.graphic, 'containers:', rZero.graphic?.containers?.length)
  } catch (e) {
    console.log('[05] zero ID: ERROR:', e.message)
  }

  // Test with negative ID
  try {
    const rNeg = await api.v1.common.requestVisualisation({ ids: [-1] })
    console.log('[05] neg ID: result:', rNeg.result, 'maxLevel:', rNeg.maxLevel)
    console.log('[05] neg ID: graphic?', !!rNeg.graphic)
  } catch (e) {
    console.log('[05] neg ID: ERROR:', e.message)
  }

  // Test with mix of valid and invalid IDs
  try {
    const rMixed = await api.v1.common.requestVisualisation({ ids: [boxId, 999999] })
    console.log('[05] mixed valid+invalid: result:', rMixed.result, 'maxLevel:', rMixed.maxLevel)
    console.log('[05] mixed: graphic?', !!rMixed.graphic, 'containers:', rMixed.graphic?.containers?.length)
  } catch (e) {
    console.log('[05] mixed: ERROR:', e.message)
  }

  // Test without ids param at all
  try {
    const rNoIds = await api.v1.common.requestVisualisation({})
    console.log('[05] no ids param: result:', rNoIds.result, 'maxLevel:', rNoIds.maxLevel)
    console.log('[05] no ids: graphic?', !!rNoIds.graphic)
  } catch (e) {
    console.log('[05] no ids: ERROR:', e.message)
  }

  return { partId }
}
