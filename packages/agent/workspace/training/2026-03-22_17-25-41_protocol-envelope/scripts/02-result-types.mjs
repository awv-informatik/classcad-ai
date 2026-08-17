// 02 — Explore different result types: real, point, VOID, string
// Using evaluateExpression for real/point, getAppVersion for string, clear for VOID

export default async function (api) {
  // String result
  const str = await api.v1.common.getAppVersion({})
  console.log('[result-type] string:', typeof str.result, JSON.stringify(str.result))

  // Real result (evaluateExpression with math)
  const real = await api.v1.common.evaluateExpression({ expression: '2+3' })
  console.log('[result-type] real:', typeof real.result, real.result)

  // Point result (evaluateExpression can return points?)
  const point = await api.v1.common.evaluateExpression({ expression: 'point(1,2,3)' })
  console.log('[result-type] point attempt:', typeof point.result, JSON.stringify(point.result))

  // VOID result (clear)
  const voidRes = await api.v1.common.clear({})
  console.log('[result-type] VOID:', typeof voidRes.result, voidRes.result, JSON.stringify(voidRes.result))

  // Object result (getDatabaseSettings)
  const obj = await api.v1.common.getDatabaseSettings({})
  console.log('[result-type] object:', typeof obj.result, JSON.stringify(obj.result))

  // Trig — radians
  const trig = await api.v1.common.evaluateExpression({ expression: 'sin(C:PI/2)' })
  console.log('[result-type] trig:', typeof trig.result, trig.result)

  return {}
}
