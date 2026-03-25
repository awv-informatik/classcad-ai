// Real-world: spring calculations
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Spring' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'wireDiam', value: 2 },
      { name: 'coilDiam', value: 20 },
      { name: 'activeCoils', value: 8 },
      { name: 'freeLength', value: 40 },
      // Shear modulus of steel (MPa)
      { name: 'G', value: 79300 },
      // Spring index
      { name: 'springIndex', value: 'coilDiam / wireDiam' },
      // Spring rate (N/mm)
      { name: 'springRate', value: 'G * pow(wireDiam, 4) / (8 * pow(coilDiam, 3) * activeCoils)' },
      // Solid length (total coils = active + 2 for closed ends)
      { name: 'totalCoils', value: 'activeCoils + 2' },
      { name: 'solidLength', value: 'totalCoils * wireDiam' },
      // Max deflection
      { name: 'maxDeflection', value: 'freeLength - solidLength' },
      // Max force
      { name: 'maxForce', value: 'springRate * maxDeflection' },
      // Pitch (distance between coils)
      { name: 'pitch', value: '(freeLength - 2 * wireDiam) / activeCoils' },
      // Helix angle
      { name: 'helixAngle', value: 'atan(pitch, C:PI * coilDiam)' },
    ],
  })

  const names = ['wireDiam', 'coilDiam', 'activeCoils', 'freeLength', 'G',
    'springIndex', 'springRate', 'totalCoils', 'solidLength',
    'maxDeflection', 'maxForce', 'pitch', 'helixAngle']
  for (const name of names) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[18] ${name} = ${r.result.value.toFixed(4)}`)
  }

  return { partId }
}
