// Realistic usage: create a closed profile using lines + arcBy3Points for filleted corners
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Profile' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Rectangle-ish with rounded top: bottom line, two sides, arc on top
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result  // bottom
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [60, 30, 0] })).result // right
  const arc = (await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [60, 30, 0],
    midPos: [30, 50, 0],
    endPos: [0, 30, 0],
  })).result // top arc
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [0, 0, 0] })).result  // left

  console.log('[18] l1:', l1, 'l2:', l2, 'arc:', arc, 'l3:', l3)

  // Get geometry to verify
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[18] geometry:', JSON.stringify(geo))

  await snapshot('closed-profile')

  // Try creating a sketch region
  const regionId = (await api.v1.sketch.sketchRegion({
    id: skId,
    geomIds: [l1, l2, arc, l3],
  })).result
  console.log('[18] regionId:', regionId)

  await snapshot('with-region')

  filewrite({
    lines: [l1, l2, l3],
    arc,
    geometry: geo,
    regionId,
  }, 'profile-data')

  return { partId }
}
