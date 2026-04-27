export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylTest' })).result

  // Cylinder: diameter=30 (r=15), height=50 => volume = π*15²*50 = 35342.917 mm³
  // COG should be at [0,0,25] (centered along height)
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 30, height: 50 })).result
  console.log('[03] cylId:', cylId)

  const r = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[03] result:', JSON.stringify(r.result))
  console.log('[03] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mass-props-cyl')

  const expectedVol = Math.PI * 15 * 15 * 50
  console.log('[03] expectedVolume:', expectedVol.toFixed(3))
  if (r.result) {
    console.log('[03] volumeDiff:', Math.abs(r.result.volume - expectedVol).toFixed(6))
    console.log('[03] cog:', JSON.stringify(r.result.cog))
  }

  await snapshot('cylinder')
  return { partId, cylId }
}
