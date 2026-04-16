// Test multiple slices on the same solid to carve a specific shape
// Start with a box, trim from multiple directions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceMulti' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create a box 100x100x100 (centered: -50 to 50 in each axis)
  const boxId = (await api.v1.solid.box({ id: eifId, length: 100, width: 100, height: 100 })).result
  console.log('[18] boxId:', boxId)

  await snapshot('before')

  // Slice 1: trim top at z=20
  const r1 = await api.v1.solid.slice({
    id: eifId, target: boxId,
    originPos: [0, 0, 20], normal: [0, 0, 1], keepBoth: false,
  })
  console.log('[18] slice 1 (top z=20): maxLevel:', r1.maxLevel)
  const c1 = r1.graphic?.containers?.find(c => c.owner === boxId)
  if (c1) console.log('[18] bbox after 1:', JSON.stringify(c1.properties.min), JSON.stringify(c1.properties.max))

  // Slice 2: trim right at x=30
  const r2 = await api.v1.solid.slice({
    id: eifId, target: boxId,
    originPos: [30, 0, 0], normal: [1, 0, 0], keepBoth: false,
  })
  console.log('[18] slice 2 (right x=30): maxLevel:', r2.maxLevel)
  const c2 = r2.graphic?.containers?.find(c => c.owner === boxId)
  if (c2) console.log('[18] bbox after 2:', JSON.stringify(c2.properties.min), JSON.stringify(c2.properties.max))

  // Slice 3: trim front at y=10
  const r3 = await api.v1.solid.slice({
    id: eifId, target: boxId,
    originPos: [0, 10, 0], normal: [0, 1, 0], keepBoth: false,
  })
  console.log('[18] slice 3 (front y=10): maxLevel:', r3.maxLevel)
  const c3 = r3.graphic?.containers?.find(c => c.owner === boxId)
  if (c3) console.log('[18] bbox after 3:', JSON.stringify(c3.properties.min), JSON.stringify(c3.properties.max))

  filewrite({
    after1: c1 ? { min: c1.properties.min, max: c1.properties.max } : null,
    after2: c2 ? { min: c2.properties.min, max: c2.properties.max } : null,
    after3: c3 ? { min: c3.properties.min, max: c3.properties.max } : null,
  }, 'multi-slice-bboxes')

  await snapshot('after-3-slices')

  return { partId, boxId }
}
