// getPoints on multiple circles — each has its own centerId
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [20, 20, 0], radius: 15 })).result
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [60, 40, 0], radius: 10 })).result

  const pts1 = (await api.v1.sketch.getPoints({ id: c1 })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: c2 })).result

  console.log('[11] circle1 points:', JSON.stringify(pts1))
  console.log('[11] circle2 points:', JSON.stringify(pts2))
  console.log('[11] different centerIds:', pts1.centerId !== pts2.centerId)

  filewrite({
    circle1: { id: c1, points: pts1 },
    circle2: { id: c2, points: pts2 },
    distinctCenters: pts1.centerId !== pts2.centerId
  }, 'multiple-circles')

  await snapshot('two-circles')
  return { partId }
}
