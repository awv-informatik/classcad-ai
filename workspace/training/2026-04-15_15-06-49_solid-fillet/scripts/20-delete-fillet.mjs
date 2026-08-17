// 20 — Can we delete a fillet? Try deleteSolid on the result.
// Fillet modifies the solid in-place and returns the same solid ID.
// So we can't "undo" it with deleteSolid (that would delete the whole solid).
// Test: what if we pass the fillet result to deleteSolid?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const edge = (await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: 0 })).result

  const filletR = await api.v1.solid.fillet({ id: eifId, radius: 10, geomIds: [edge] })
  console.log('[20] fillet result:', filletR.result)

  await snapshot('after-fillet')

  // The result is [61] — same as the box ID. We can't delete it without losing the whole solid.
  // Let's confirm this by checking the container count
  const containers = filletR.graphic?.containers || []
  console.log('[20] containers after fillet:', containers.length)
  for (const c of containers) {
    console.log(`[20] container: id=${c.id}`)
  }

  // Verify: fillet does NOT create a separate entity — the solid is modified in-place
  filewrite({
    filletResult: filletR.result,
    originalBoxId: boxId,
    sameId: filletR.result?.[0] === boxId,
  }, 'delete-fillet-check')

  return { partId, eifId, boxId }
}
