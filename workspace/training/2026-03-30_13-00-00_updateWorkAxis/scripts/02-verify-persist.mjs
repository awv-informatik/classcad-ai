// Test: update position/direction and verify they persist after closeFeature using structure data
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'WA1', position: [10, 20, 30], direction: [1, 0, 0]
  })).result
  console.log('[02] waId:', waId)

  // Dump structure before update
  const beforeR = await api.v1.part.workAxis({ id: partId, name: 'dummy' })
  // Actually, let's just use getExpression to read back params
  const exprBefore = await api.v1.part.getExpression({ id: waId })
  console.log('[02] before getExpression result:', JSON.stringify(exprBefore.result))
  filewrite(exprBefore.result, 'expr-before')

  // Open, update, close
  await api.v1.part.openFeature({ id: waId })
  const upR = await api.v1.part.updateWorkAxis({
    id: waId,
    position: [50, 60, 70],
    direction: [0, 0, 1]
  })
  console.log('[02] update result:', upR.result, 'maxLevel:', upR.maxLevel)
  await api.v1.part.closeFeature({ id: waId })

  // Read back after close
  const exprAfter = await api.v1.part.getExpression({ id: waId })
  console.log('[02] after getExpression result:', JSON.stringify(exprAfter.result))
  filewrite(exprAfter.result, 'expr-after')

  filewrite({ updateResult: upR.result, updateMaxLevel: upR.maxLevel }, 'update-response')

  return { partId }
}
