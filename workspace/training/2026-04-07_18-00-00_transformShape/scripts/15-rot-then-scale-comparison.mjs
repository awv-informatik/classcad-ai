// Test: orthogonal rotation matrix vs non-orthogonal — verify orthogonal works correctly
// Create two shapes: one rotated with orthogonal matrix, one with rotateShape for comparison
export default async function (api, { snapshot, filewrite }) {
  // Shape 1: transform with pure rotation (orthogonal, 45° Z)
  const p1 = (await api.v1.part.create({ name: 'MatrixRot' })).result
  const ei1 = (await api.v1.part.entityInjection({ id: p1 })).result
  const s1 = (await api.v1.curve.shape({ id: ei1, name: 'S1' })).result
  await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [{ xa: 10, ya: 0 }, { xa: 40, ya: 0 }, { xa: 40, ya: 15 }, { xa: 10, ya: 15 }],
    close: true,
  })

  const c = Math.cos(Math.PI / 4)
  const s = Math.sin(Math.PI / 4)
  const r1 = await api.v1.curve.transformShape({
    id: s1,
    matrix: [
      [c, -s, 0, 0],
      [s, c, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[15] orthogonal rot result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Shape 2: rotateShape for comparison
  const p2 = (await api.v1.part.create({ name: 'RotateAPI' })).result
  const ei2 = (await api.v1.part.entityInjection({ id: p2 })).result
  const s2 = (await api.v1.curve.shape({ id: ei2, name: 'S2' })).result
  await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [{ xa: 10, ya: 0 }, { xa: 40, ya: 0 }, { xa: 40, ya: 15 }, { xa: 10, ya: 15 }],
    close: true,
  })
  const r2 = await api.v1.curve.rotateShape({ id: s2, rotation: [0, 0, Math.PI / 4] })
  console.log('[15] rotateShape result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('15-rotation-comparison')

  return { p1, p2 }
}
