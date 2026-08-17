// 03 — Test rotation around each individual axis (X, Y, Z)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AxisTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create 3 shapes, rotate each around a different axis
  const shapes = []
  const offsets = [[-40, 0], [0, 0], [40, 0]]
  const labels = ['X-rot', 'Y-rot', 'Z-rot']

  for (let i = 0; i < 3; i++) {
    const s = (await api.v1.curve.shape({ id: eifId, name: labels[i] })).result
    const ox = offsets[i][0]
    await api.v1.curve.advancedPolyline({
      id: s,
      pld: [
        { xa: ox, ya: 0 },
        { xa: ox + 20, ya: 0 },
        { xa: ox + 20, ya: 10 },
        { xa: ox + 5, ya: 10 },
        { xa: ox + 5, ya: 25 },
        { xa: ox, ya: 25 },
      ],
      close: true,
    })
    shapes.push(s)
  }

  // Rotate each around a different axis by 45° (PI/4)
  const angle = Math.PI / 4

  const rX = await api.v1.curve.rotateShape({ id: shapes[0], rotation: [angle, 0, 0] })
  console.log('[03] X-rotation result:', rX.result, 'maxLevel:', rX.maxLevel)

  const rY = await api.v1.curve.rotateShape({ id: shapes[1], rotation: [0, angle, 0] })
  console.log('[03] Y-rotation result:', rY.result, 'maxLevel:', rY.maxLevel)

  const rZ = await api.v1.curve.rotateShape({ id: shapes[2], rotation: [0, 0, angle] })
  console.log('[03] Z-rotation result:', rZ.result, 'maxLevel:', rZ.maxLevel)

  await snapshot('each-axis-45deg')

  return { partId }
}
