// Q: What math functions exist? Test trig, logarithmic, etc.
// Also verify deg suffix behavior more thoroughly
export default async function (api) {
  const tests = [
    // Trig functions
    ['sin(C:PI/6)', 0.5, 'sin'],
    ['cos(C:PI/3)', 0.5, 'cos'],
    ['tan(C:PI/4)', 1.0, 'tan'],
    ['asin(0.5)', Math.PI / 6, 'asin'],
    ['acos(0.5)', Math.PI / 3, 'acos'],
    ['atan(1)', Math.PI / 4, 'atan'],
    // Logarithmic
    ['ln(C:E)', 1, 'ln (natural log)'],
    ['exp(1)', Math.E, 'exp'],
    ['log(100)', null, 'log (base 10?)'],
    // Powers
    ['sqrt(144)', 12, 'sqrt'],
    ['pow(2,10)', 1024, 'pow'],
    ['abs(-42)', 42, 'abs'],
    // Degree suffix variations
    ['180deg', Math.PI, '180deg = PI'],
    ['360deg', 2 * Math.PI, '360deg = 2PI'],
    ['90deg', Math.PI / 2, '90deg = PI/2'],
    ['1rad', null, '1rad (does rad suffix exist?)'],
    // Constants
    ['C:PI', Math.PI, 'C:PI'],
    ['C:E', Math.E, 'C:E'],
    ['C:GRAVITY', null, 'C:GRAVITY (does it exist?)'],
    // Min/max
    ['min(3, 7)', null, 'min'],
    ['max(3, 7)', null, 'max'],
    // Floor/ceil
    ['floor(3.7)', null, 'floor'],
    ['ceil(3.2)', null, 'ceil'],
    ['round(3.5)', null, 'round'],
    // Modulo
    ['mod(10, 3)', null, 'mod'],
    ['10 % 3', null, '% operator'],
  ]

  for (const [expr, expected, label] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr, silent: 1 })
    const status = r.maxLevel <= 31 ? '✓' : '❌'
    const match = expected !== null && Math.abs(r.result - expected) < 0.0001 ? '=' : ''
    console.log(`[14] ${status} ${label}: ${expr} → ${r.result} ${match}`)
  }

  return {}
}
