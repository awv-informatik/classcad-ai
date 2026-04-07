// 28 — Test: does the accumulation fix work for separate shapes?
export default async function (api, { snapshot, filewrite }) {
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: true })

  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: line
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Line1' })).result
  await api.v1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [50, 0, 0] })

  // Shape 2: arc
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Arc1' })).result
  await api.v1.curve.arcByCenter({
    id: s2, centerPos: [50, 15, 0], startPos: [50, 0, 0], endPos: [65, 15, 0], isClockwise: false,
  })

  // Shape 3: line
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'Line2' })).result
  await api.v1.curve.line({ id: s3, startPos: [65, 15, 0], endPos: [65, 40, 0] })

  // Shape 4: arc
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'Arc2' })).result
  await api.v1.curve.arcByCenter({
    id: s4, centerPos: [50, 40, 0], startPos: [65, 40, 0], endPos: [50, 55, 0], isClockwise: false,
  })

  // Shape 5: line
  const s5 = (await api.v1.curve.shape({ id: eifId, name: 'Line3' })).result
  await api.v1.curve.line({ id: s5, startPos: [50, 55, 0], endPos: [0, 55, 0] })

  await snapshot('accumulated-shapes')
  return { partId }
}
