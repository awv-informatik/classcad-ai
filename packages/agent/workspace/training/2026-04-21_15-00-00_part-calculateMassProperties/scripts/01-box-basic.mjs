export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MassTest' })).result

  // Box: 60 x 40 x 30 => volume = 72000 mm³
  // COG should be at center: [30, 20, 15]
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  console.log('[01] boxId:', boxId)

  const r = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[01] result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mass-props-box')

  // Expected: volume=72000, cog=[30,20,15]
  const expectedVol = 60 * 40 * 30
  console.log('[01] expectedVolume:', expectedVol)
  if (r.result) {
    console.log('[01] volumeDiff:', Math.abs(r.result.volume - expectedVol))
    console.log('[01] cog:', JSON.stringify(r.result.cog))
  }

  await snapshot('box')
  return { partId, boxId }
}
