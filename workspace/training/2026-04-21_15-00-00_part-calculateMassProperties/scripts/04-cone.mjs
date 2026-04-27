export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeTest' })).result

  // Cone: bDiameter=40 (R=20), tDiameter=0, height=60
  // volume = (1/3)*π*R²*h = (1/3)*π*20²*60 = 25132.741 mm³
  // COG of a cone from base: h/4 = 15 => cog z=15
  const coneId = (await api.v1.part.cone({ id: partId, name: 'Cone1', bDiameter: 40, tDiameter: 0, height: 60 })).result
  console.log('[04] coneId:', coneId)

  const r = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[04] result:', JSON.stringify(r.result))
  console.log('[04] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mass-props-cone')

  const expectedVol = (1 / 3) * Math.PI * 20 * 20 * 60
  console.log('[04] expectedVolume:', expectedVol.toFixed(3))
  if (r.result) {
    console.log('[04] volumeDiff:', Math.abs(r.result.volume - expectedVol).toFixed(6))
    console.log('[04] cog:', JSON.stringify(r.result.cog))
    // Cone COG is at h/4 from base = 15
    console.log('[04] expectedCogZ:', 15)
  }

  await snapshot('cone')
  return { partId, coneId }
}
