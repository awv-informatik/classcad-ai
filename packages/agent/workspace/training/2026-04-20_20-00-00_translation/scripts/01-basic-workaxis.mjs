export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslationTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 20, height: 25,
  })).result

  // Add a reference body that doesn't move — to see the translation effect
  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    height: 5, diameter: 10,
    xPosition: 0, yPosition: 0, zPosition: -10,
  })).result

  const waX = (await api.v1.part.workAxis({
    id: partId, name: 'AxisX',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  await snapshot('before-translation')

  // Translate the box 50mm along +X
  const tId = (await api.v1.part.translation({
    id: partId,
    name: 'Trans1',
    targets: [boxId],
    references: [waX],
    distance: 50,
  })).result
  console.log('[01] translation result:', tId)

  const r = await api.v1.common.recalc({})
  console.log('[01] recalc maxLevel:', r.maxLevel)

  await snapshot('after-translation')

  return { partId, tId }
}
