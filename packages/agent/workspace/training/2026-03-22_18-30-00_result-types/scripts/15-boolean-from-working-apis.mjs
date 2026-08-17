// Follow-up: isSolved doesn't exist! Test other boolean-returning APIs.
// moveGeometry returned 0 (number). Confirm: are booleans always 0/1 numbers?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Bool3' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw geometry for moveGeometry
  const lines = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [50, 50, 0] })).result

  // moveGeometry — should return boolean (true if solved)
  const r1 = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [lines[0]], translation: [5, 5, 0] })
  console.log(`[bool] moveGeometry: result=${JSON.stringify(r1.result)} type=${typeof r1.result} ===true:${r1.result===true} ===1:${r1.result===1} ===0:${r1.result===0}`)

  // Try evaluateExpression with boolean-like expressions
  const boolExprs = ['1==1', '1==2', '1>0', '1<0', 'TRUE', 'FALSE', 'true', 'false']
  for (const expr of boolExprs) {
    const r = await api.v1.common.evaluateExpression({ expression: expr, silent: true })
    console.log(`[bool-expr] "${expr}" result=${JSON.stringify(r.result)} type=${typeof r.result} maxLevel=${r.maxLevel}`)
  }

  return {}
}
