// log (base 10 or natural?), fmod, div, a_r, r_a, atan(y,x), hyperbolic
export default async function (api) {
  // log ambiguity test
  const logE = await api.v1.common.evaluateExpression({ expression: 'log(exp(1))' })
  const log10 = await api.v1.common.evaluateExpression({ expression: 'log(10)' })
  const log100 = await api.v1.common.evaluateExpression({ expression: 'log(100)' })
  console.log('[04] log(e):', logE.result, '(if natural=1, if base10≈0.434)')
  console.log('[04] log(10):', log10.result, '(if natural≈2.303, if base10=1)')
  console.log('[04] log(100):', log100.result, '(if natural≈4.605, if base10=2)')

  // fmod and div
  const fm = await api.v1.common.evaluateExpression({ expression: 'fmod(17, 5)' })
  const dv = await api.v1.common.evaluateExpression({ expression: 'div(17, 5)' })
  console.log('[04] fmod(17,5):', fm.result, '(expected 2)')
  console.log('[04] div(17,5):', dv.result, '(expected 3)')

  // degree/radian conversion
  const ar = await api.v1.common.evaluateExpression({ expression: 'a_r(180)' })
  const ra = await api.v1.common.evaluateExpression({ expression: 'r_a(C:PI)' })
  console.log('[04] a_r(180):', ar.result, '(expected', Math.PI, ')')
  console.log('[04] r_a(PI):', ra.result, '(expected 180)')

  // atan two-arg form
  const at2 = await api.v1.common.evaluateExpression({ expression: 'atan(1, 1)' })
  console.log('[04] atan(1,1):', at2.result, '(expected', Math.PI/4, ')')

  // hyperbolic
  const sh = await api.v1.common.evaluateExpression({ expression: 'sinh(0)' })
  const ch = await api.v1.common.evaluateExpression({ expression: 'cosh(0)' })
  const th = await api.v1.common.evaluateExpression({ expression: 'tanh(0)' })
  console.log('[04] sinh(0):', sh.result, 'cosh(0):', ch.result, 'tanh(0):', th.result)
}
