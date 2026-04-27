export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  // Sphere: radius=25 => volume = (4/3)*π*25³ = 65449.847 mm³
  // COG should be at origin [0,0,0] (default position)
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 25 })).result
  console.log('[02] sphId:', sphId)

  const r = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[02] result:', JSON.stringify(r.result))
  console.log('[02] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mass-props-sphere')

  const expectedVol = (4 / 3) * Math.PI * Math.pow(25, 3)
  console.log('[02] expectedVolume:', expectedVol.toFixed(3))
  if (r.result) {
    console.log('[02] volumeDiff:', Math.abs(r.result.volume - expectedVol).toFixed(6))
    console.log('[02] cog:', JSON.stringify(r.result.cog))
  }

  await snapshot('sphere')
  return { partId, sphId }
}
