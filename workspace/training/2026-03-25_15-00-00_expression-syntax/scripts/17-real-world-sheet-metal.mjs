// Real-world: sheet metal bend calculations
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'SheetMetal' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'thickness', value: 2 },
      { name: 'innerRadius', value: 3 },
      { name: 'bendAngleDeg', value: 90 },
      { name: 'bendAngle', value: 'a_r(bendAngleDeg)' },
      // K-factor (typical 0.33 for air bending)
      { name: 'kFactor', value: 0.33 },
      // Neutral axis radius
      { name: 'neutralRadius', value: 'innerRadius + kFactor * thickness' },
      // Bend allowance
      { name: 'bendAllowance', value: 'bendAngle * neutralRadius' },
      // Bend deduction
      { name: 'outerSetback', value: '(innerRadius + thickness) * tan(bendAngle / 2)' },
      { name: 'bendDeduction', value: '2 * outerSetback - bendAllowance' },
      // Flat pattern length for two flanges
      { name: 'flange1', value: 50 },
      { name: 'flange2', value: 30 },
      { name: 'flatLength', value: 'flange1 + flange2 + bendAllowance' },
    ],
  })

  const names = ['thickness', 'innerRadius', 'bendAngleDeg', 'bendAngle', 'kFactor',
    'neutralRadius', 'bendAllowance', 'outerSetback', 'bendDeduction',
    'flange1', 'flange2', 'flatLength']
  for (const name of names) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[17] ${name} = ${r.result.value.toFixed(4)}`)
  }

  return { partId }
}
