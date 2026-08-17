// Test: 90° rotation around Z via matrix — compare with rotateShape
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotZ90' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // Asymmetric L-shape so rotation is visually obvious
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 40, ya: 0 },
      { xa: 40, ya: 10 },
      { xa: 10, ya: 10 },
      { xa: 10, ya: 25 },
      { xa: 0, ya: 25 },
    ],
    close: true,
  })

  // 90° CCW around Z: cos90=0, sin90=1
  // Rotation matrix: [[cos, -sin, 0, 0], [sin, cos, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [0, -1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[03] rot Z 90° result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rot-z90-response')

  await snapshot('03-rotated-z90')

  return { partId, shapeId }
}
