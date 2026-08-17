// Fillet multiple corners of a rectangle
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiFillet' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] })
  const lineIds = rect.result
  console.log('[06] rect lineIds:', JSON.stringify(lineIds))

  // Fillet corner between line[0] and line[1]
  const f1 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 10 })
  console.log('[06] fillet1 result:', JSON.stringify(f1.result), 'maxLevel:', f1.maxLevel)

  // Fillet corner between line[1] and line[2]
  const f2 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[1], lineIds[2]], offset: 10 })
  console.log('[06] fillet2 result:', JSON.stringify(f2.result), 'maxLevel:', f2.maxLevel)

  // Fillet corner between line[2] and line[3]
  const f3 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[2], lineIds[3]], offset: 10 })
  console.log('[06] fillet3 result:', JSON.stringify(f3.result), 'maxLevel:', f3.maxLevel)

  // Fillet corner between line[3] and line[0]
  const f4 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[3], lineIds[0]], offset: 10 })
  console.log('[06] fillet4 result:', JSON.stringify(f4.result), 'maxLevel:', f4.maxLevel)

  filewrite({
    f1: f1.result, f2: f2.result, f3: f3.result, f4: f4.result
  }, 'multi-fillet-results')

  await snapshot('all-corners-filleted')

  return { partId }
}
