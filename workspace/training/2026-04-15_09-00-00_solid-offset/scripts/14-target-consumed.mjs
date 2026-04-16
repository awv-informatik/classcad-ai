// 14 — Does offset create a new solid or modify in place? Verify by checking if target still exists
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TargetTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[14] original boxId:', boxId)

  // Dump structure before
  const structBefore = (await api.v1.solid.box({ id: eifId, length: 1, width: 1, height: 1, translation: [0, 0, 0] }))
  // Actually let me just check the structure after offset
  // First, offset the box
  const r = await api.v1.solid.offset({ id: eifId, target: boxId, distance: 5 })
  console.log('[14] offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[14] offset result === boxId?', r.result === boxId)

  // Try to use the original boxId — can we still reference it?
  // Try a translation on the offset result
  const r2 = await api.v1.solid.translation({ id: eifId, target: r.result, translation: [10, 0, 0] })
  console.log('[14] translate offset result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Count bodies in the structure
  if (r.structure) {
    const bodyCount = JSON.stringify(r.structure).split('"Solid"').length - 1
    console.log('[14] approx body count after offset:', bodyCount)
  }

  await snapshot('after-offset-and-translate')

  return { boxId, offsetResult: r.result, sameId: r.result === boxId }
}
