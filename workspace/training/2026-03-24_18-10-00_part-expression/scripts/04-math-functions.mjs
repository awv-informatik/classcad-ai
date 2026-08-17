// Create expressions using math functions and constants
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'pi_val', value: 'C:PI' },
      { name: 'half_pi', value: 'C:PI / 2' },
      { name: 'radius', value: 25 },
      { name: 'circumference', value: '2 * C:PI * radius' },
      { name: 'area', value: 'C:PI * pow(radius, 2)' },
      { name: 'sqrt_val', value: 'sqrt(144)' },
      { name: 'trig_val', value: 'sin(C:PI / 6)' },
    ],
  })

  console.log('[04] result:', r.result)
  console.log('[04] maxLevel:', r.maxLevel)

  // Verify computed values
  const checks = ['pi_val', 'circumference', 'area', 'sqrt_val', 'trig_val']
  for (const name of checks) {
    const v = await api.v1.common.evaluateExpression({ expression: name, id: 6 })
    console.log(`[04] ${name} =`, v.result)
  }

  return { partId }
}
