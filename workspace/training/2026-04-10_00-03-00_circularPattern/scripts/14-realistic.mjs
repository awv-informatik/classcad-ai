// Realistic usage: bolt hole circle — 8 circles evenly spaced around a center
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoltHoleCircle' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Center point
  const center = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result

  // Create one bolt hole circle at [30, 0, 0]
  const hole = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 0, 0], radius: 5 })).result
  console.log('[14] hole id:', hole)

  // Create rigid set from the hole
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [hole] })).result

  // Pattern 8 holes evenly around 360 degrees
  // angle = 2*PI / 8 = PI/4 (45 degrees between each)
  const r = await api.v1.sketch.circularPattern({
    id: skId, rigidSetId: rsId, centerId: center,
    angle: Math.PI / 4,
    count: 8,
  })
  console.log('[14] maxLevel:', r.maxLevel)
  console.log('[14] geometry count:', r.result?.geometry?.length)
  console.log('[14] dimension:', r.result?.dimension)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'bolt-holes')

  await snapshot('bolt-hole-circle-8')
  return { partId }
}
