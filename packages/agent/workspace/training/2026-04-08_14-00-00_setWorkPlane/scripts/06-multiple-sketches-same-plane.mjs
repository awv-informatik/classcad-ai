// Test: Multiple sketches sharing the same work plane via setWorkPlane
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SharedPlane' })).result

  const sk1 = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result
  const sk2 = (await api.v1.sketch.create({ id: partId, name: 'Sk2' })).result
  console.log('[06] sk1:', sk1, 'sk2:', sk2)

  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'SharedWP', normal: [0, 1, 0], position: [0, 100, 0],
  })).result
  console.log('[06] wpId:', wpId)

  // Move both sketches to the same plane
  const r1 = await api.v1.sketch.setWorkPlane({ id: sk1, planeId: wpId })
  console.log('[06] sk1 → wp — maxLevel:', r1.maxLevel)
  const r2 = await api.v1.sketch.setWorkPlane({ id: sk2, planeId: wpId })
  console.log('[06] sk2 → wp — maxLevel:', r2.maxLevel)

  // Check both sketches reference the same plane
  const sk1After = r2.structure?.tree?.[''+sk1]
  const sk2After = r2.structure?.tree?.[''+sk2]
  console.log('[06] sk1 planeRef:', sk1After?.members?.planeReference?.value)
  console.log('[06] sk2 planeRef:', sk2After?.members?.planeReference?.value)
  console.log('[06] same?', sk1After?.members?.planeReference?.value === sk2After?.members?.planeReference?.value)

  filewrite({
    sk1: { planeRef: sk1After?.members?.planeReference?.value, coordSys: sk1After?.coordinateSystem },
    sk2: { planeRef: sk2After?.members?.planeReference?.value, coordSys: sk2After?.coordinateSystem },
  }, 'shared-plane')

  return { partId }
}
