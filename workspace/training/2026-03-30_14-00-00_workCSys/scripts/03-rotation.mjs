// Test: CUSTOM with rotation — rotation vector in radians
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Rotate 90° around Z (pi/2)
  const r1 = await api.v1.part.workCSys({
    id: partId, name: 'CS_rotZ90',
    rotation: [0, 0, Math.PI / 2]
  })
  console.log('[03] rotZ90 result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Rotate 45° around X
  const r2 = await api.v1.part.workCSys({
    id: partId, name: 'CS_rotX45',
    rotation: [Math.PI / 4, 0, 0]
  })
  console.log('[03] rotX45 result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Compound rotation: 30° around X + 45° around Y
  const r3 = await api.v1.part.workCSys({
    id: partId, name: 'CS_compound',
    rotation: [Math.PI / 6, Math.PI / 4, 0]
  })
  console.log('[03] compound result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    rotZ90: { result: r1.result, maxLevel: r1.maxLevel },
    rotX45: { result: r2.result, maxLevel: r2.maxLevel },
    compound: { result: r3.result, maxLevel: r3.maxLevel }
  }, 'rotation-responses')

  await snapshot('rotations')
  return { partId }
}
