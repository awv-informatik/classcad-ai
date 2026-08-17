// Test: deleting a rigid set
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DelRigidSet' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create geometry
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 50, 0] })).result

  // Create a rigid set
  const rigidSet = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [line1, line2] })).result
  console.log('[06] rigidSet ID:', rigidSet)

  // Delete the rigid set
  const r = await api.v1.sketch.deleteObject({ ids: [rigidSet] })
  console.log('[06] delete rigidSet result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-rigidset-response')

  // Verify geometry still exists
  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[06] lines after rigidSet delete:', geomAfter.result?.lines?.length)
  filewrite(geomAfter.result, 'geom-after-rigidset-delete')

  return { partId }
}
