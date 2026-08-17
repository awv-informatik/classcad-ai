// Test which side is kept based on normal direction
// Docs: "Part on the negative side of normal vector is removed"
// Normal [0,0,1] pointing up → negative side is below → removes bottom half
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceNormal' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create box 80x60x40 + small reference cylinder at x=100 (untouched by slice)
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const refId = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 10, translation: [100, 0, 0] })).result
  console.log('[04] boxId:', boxId, 'refId:', refId)

  await snapshot('before')

  // Slice with normal [0,0,1] at z=20 → should keep top half (z=20 to z=40)
  const r = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 20],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[04] slice result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'slice-up-response')

  await snapshot('after-normal-up')

  // The box should now be half height. Reference cylinder should be visually taller relative to the box.
  return { partId, boxId, refId }
}
