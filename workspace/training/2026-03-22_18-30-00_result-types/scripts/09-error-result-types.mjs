// Test: what does result look like on errors for APIs with different return types?
// Is result always null on error, regardless of declared return type?
export default async function (api) {
  // Error on id-returning API
  const r1 = await api.v1.sketch.create({ id: 999999 })
  console.log(`[error] id-api: result=${JSON.stringify(r1.result)} type=${typeof r1.result} ===null:${r1.result===null} maxLevel=${r1.maxLevel}`)

  // Error on boolean-returning API
  const r2 = await api.v1.sketch.isSolved({ id: 999999 })
  console.log(`[error] bool-api: result=${JSON.stringify(r2.result)} type=${typeof r2.result} ===null:${r2.result===null} maxLevel=${r2.maxLevel}`)

  // Error on Array-returning API
  const r3 = await api.v1.sketch.rectangle({ id: 999999, startPos: [0, 0, 0], endPos: [50, 50, 0] })
  console.log(`[error] array-api: result=${JSON.stringify(r3.result)} type=${typeof r3.result} ===null:${r3.result===null} isArray=${Array.isArray(r3.result)} maxLevel=${r3.maxLevel}`)

  // Error on real-returning API
  const r4 = await api.v1.common.evaluateExpression({ expression: 'garbage!!!' })
  console.log(`[error] real-api: result=${JSON.stringify(r4.result)} type=${typeof r4.result} ===null:${r4.result===null} maxLevel=${r4.maxLevel}`)

  // Error on VOID-returning API (setObjectName with bad id)
  const r5 = await api.v1.common.setObjectName({ id: 999999, name: 'X' })
  console.log(`[error] void-api: result=${JSON.stringify(r5.result)} type=${typeof r5.result} ===null:${r5.result===null} maxLevel=${r5.maxLevel}`)

  return {}
}
