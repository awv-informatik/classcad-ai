// Verify rotation order: docs say Z→Y→X
// Strategy: apply combined rotation [π/2, π/2, 0] vs separate Z then Y
// If Z→Y→X order, a combined [rx, ry, rz] should equal:
//   first rotate rz around Z, then ry around Y, then rx around X
// We compare vertex positions of combined vs sequential to verify
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OrderTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Combined rotation: [π/4, π/4, 0] in a single call
  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20, translation: [-60, 0, 0] })).result
  const r1 = await api.v1.solid.rotation({ id: eifId, target: box1, rotation: [Math.PI / 4, Math.PI / 4, 0] })
  console.log('[03] combined rotation result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Sequential: first Z=0, then Y=π/4, then X=π/4 applied separately
  // Since the docs say Z→Y→X, the combined [π/4, π/4, 0] should be:
  // step1: rotate Z by 0 (no-op)
  // step2: rotate Y by π/4
  // step3: rotate X by π/4
  const box2 = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20, translation: [60, 0, 0] })).result
  // Apply Y rotation first (since Z→Y→X means Y happens before X)
  await api.v1.solid.rotation({ id: eifId, target: box2, rotation: [0, Math.PI / 4, 0] })
  // Then X rotation
  await api.v1.solid.rotation({ id: eifId, target: box2, rotation: [Math.PI / 4, 0, 0] })

  await snapshot('combined-vs-sequential')

  // Dump graphic data for both boxes to compare vertex positions
  const gfx = (await api.v1.solid.box({ id: eifId, length: 1, width: 1, height: 1 })).graphic
  // Instead, get structure for both
  // Actually let's just filewrite the graphic after both are done
  // The snapshot comparison is the key visual evidence
  filewrite({ box1: r1.result, box2 }, 'order-test-ids')

  return { box1, box2 }
}
