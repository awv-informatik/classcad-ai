export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TruncConeTest' })).result

  // Truncated cone: bDiameter=40 (R=20), tDiameter=10 (r=5), height=60
  // volume = (π*h/3)*(R² + R*r + r²) = (π*60/3)*(400+100+25) = 62.832 * 525 = 32986.7 mm³
  const coneId = (await api.v1.part.cone({ id: partId, name: 'TCone1', bDiameter: 40, tDiameter: 10, height: 60 })).result
  console.log('[05] coneId:', coneId)

  const r = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[05] result:', JSON.stringify(r.result))
  console.log('[05] maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mass-props-trunc-cone')

  const R = 20, rr = 5, h = 60
  const expectedVol = (Math.PI * h / 3) * (R * R + R * rr + rr * rr)
  console.log('[05] expectedVolume:', expectedVol.toFixed(3))
  if (r.result) {
    console.log('[05] volumeDiff:', Math.abs(r.result.volume - expectedVol).toFixed(6))
    console.log('[05] cog:', JSON.stringify(r.result.cog))
  }

  // Also try with a normal cone (tDiameter=0.001 to avoid the degenerate case)
  const partId2 = (await api.v1.part.create({ name: 'NearConeTest' })).result
  const cone2Id = (await api.v1.part.cone({ id: partId2, name: 'Cone2', bDiameter: 40, tDiameter: 0.001, height: 60 })).result
  const r2 = await api.v1.part.calculateMassProperties({ id: partId2 })
  console.log('[05] nearCone result:', JSON.stringify(r2.result))
  console.log('[05] nearCone maxLevel:', r2.maxLevel)

  await snapshot('truncated-cone')
  return { partId, coneId }
}
