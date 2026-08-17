// Real-world: gear dimensions from module and tooth count
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Gear' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'module', value: 2 },
      { name: 'teeth', value: 24 },
      { name: 'pressureAngleDeg', value: 20 },
      { name: 'pressureAngle', value: 'a_r(pressureAngleDeg)' },
      { name: 'pitchDiam', value: 'module * teeth' },
      { name: 'addendum', value: 'module' },
      { name: 'dedendum', value: '1.25 * module' },
      { name: 'outsideDiam', value: 'pitchDiam + 2 * addendum' },
      { name: 'rootDiam', value: 'pitchDiam - 2 * dedendum' },
      { name: 'baseCircleDiam', value: 'pitchDiam * cos(pressureAngle)' },
      { name: 'circularPitch', value: 'C:PI * module' },
      { name: 'toothThickness', value: 'circularPitch / 2' },
      { name: 'clearance', value: 'dedendum - addendum' },
    ],
  })

  const names = ['module', 'teeth', 'pressureAngleDeg', 'pressureAngle', 'pitchDiam',
    'addendum', 'dedendum', 'outsideDiam', 'rootDiam', 'baseCircleDiam',
    'circularPitch', 'toothThickness', 'clearance']
  for (const name of names) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[16] ${name} = ${r.result.value.toFixed(4)} (formula: '${r.result.expression || 'numeric'}')`)
  }

  return { partId }
}
