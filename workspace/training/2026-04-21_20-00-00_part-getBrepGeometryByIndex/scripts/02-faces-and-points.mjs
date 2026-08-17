export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const faces = []
  for (let i = 0; i < 8; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: boxId, faceIndex: i })
    console.log(`[02] faceIndex=${i}: result=${r.result}, maxLevel=${r.maxLevel}`)
    faces.push({ faceIndex: i, result: r.result, maxLevel: r.maxLevel })
  }

  const points = []
  for (let i = 0; i < 10; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: boxId, pointIndex: i })
    console.log(`[02] pointIndex=${i}: result=${r.result}, maxLevel=${r.maxLevel}`)
    points.push({ pointIndex: i, result: r.result, maxLevel: r.maxLevel })
  }

  filewrite({ faces, points }, 'faces-and-points')
  return { partId }
}
