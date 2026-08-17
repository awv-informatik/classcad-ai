// Test: translate along all axes, sequential translations, and verify with structure data
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslateTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: translate along X
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'ShapeX' })).result
  await api.v1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  const rX = await api.v1.curve.translateShape({ id: s1, translation: [50, 0, 0] })
  console.log('[08] translateX:', rX.maxLevel)

  // Shape 2: translate along Y
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'ShapeY' })).result
  await api.v1.curve.line({ id: s2, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  const rY = await api.v1.curve.translateShape({ id: s2, translation: [0, 50, 0] })
  console.log('[08] translateY:', rY.maxLevel)

  // Shape 3: translate along Z
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'ShapeZ' })).result
  await api.v1.curve.line({ id: s3, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  const rZ = await api.v1.curve.translateShape({ id: s3, translation: [0, 0, 50] })
  console.log('[08] translateZ:', rZ.maxLevel)

  // Shape 4: translate combined XYZ
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'ShapeXYZ' })).result
  await api.v1.curve.line({ id: s4, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  const rXYZ = await api.v1.curve.translateShape({ id: s4, translation: [30, 40, 50] })
  console.log('[08] translateXYZ:', rXYZ.maxLevel)

  // Shape 5: sequential translations (cumulative?)
  const s5 = (await api.v1.curve.shape({ id: eifId, name: 'Cumulative' })).result
  await api.v1.curve.line({ id: s5, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  const rSeq1 = await api.v1.curve.translateShape({ id: s5, translation: [10, 0, 0] })
  const rSeq2 = await api.v1.curve.translateShape({ id: s5, translation: [10, 0, 0] })
  const rSeq3 = await api.v1.curve.translateShape({ id: s5, translation: [10, 0, 0] })
  console.log('[08] sequential:', rSeq1.maxLevel, rSeq2.maxLevel, rSeq3.maxLevel)

  await snapshot('all-translated')

  // Dump structure to see positions
  const structR = await api.v1.common.getAppVersion({})
  // Actually, let's get the full graphic to see positions
  filewrite({
    results: { x: rX.maxLevel, y: rY.maxLevel, z: rZ.maxLevel, xyz: rXYZ.maxLevel },
    sequential: [rSeq1.maxLevel, rSeq2.maxLevel, rSeq3.maxLevel],
  }, 'translate-results')

  return { partId }
}
