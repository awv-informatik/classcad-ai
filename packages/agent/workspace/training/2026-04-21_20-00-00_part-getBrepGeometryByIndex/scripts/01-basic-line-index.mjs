export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const results = []
  for (let i = 0; i < 14; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: i })
    console.log(`[01] lineIndex=${i}: result=${r.result}, maxLevel=${r.maxLevel}`)
    results.push({ lineIndex: i, result: r.result, maxLevel: r.maxLevel, messages: r.messages })
  }

  filewrite(results, 'line-indices')
  await snapshot('box')
  return { partId }
}
