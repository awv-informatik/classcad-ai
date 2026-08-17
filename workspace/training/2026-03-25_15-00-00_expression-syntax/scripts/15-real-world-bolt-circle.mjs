// Real-world: bolt circle pattern — N holes evenly spaced on a circle
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'BoltCircle' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'pcd', value: 80 },           // pitch circle diameter
      { name: 'numHoles', value: 6 },
      { name: 'holeDiam', value: 10 },
      { name: 'plateThickness', value: 15 },
      { name: 'plateDiam', value: 'pcd + holeDiam * 3' },
      { name: 'angleStep', value: '360 / numHoles' },
      { name: 'angleStepRad', value: 'a_r(angleStep)' },
      // First hole position (polar to cartesian)
      { name: 'hole1X', value: 'pcd/2 * cos(0)' },
      { name: 'hole1Y', value: 'pcd/2 * sin(0)' },
      // Second hole position
      { name: 'hole2X', value: 'pcd/2 * cos(angleStepRad)' },
      { name: 'hole2Y', value: 'pcd/2 * sin(angleStepRad)' },
    ],
  })

  const names = ['pcd', 'numHoles', 'holeDiam', 'plateThickness', 'plateDiam', 'angleStep', 'angleStepRad', 'hole1X', 'hole1Y', 'hole2X', 'hole2Y']
  for (const name of names) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[15] ${name} = ${r.result.value}`)
  }

  return { partId }
}
