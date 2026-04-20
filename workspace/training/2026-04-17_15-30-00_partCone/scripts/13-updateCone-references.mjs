export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeUpdRef' })).result

  // Reference box at origin for visual comparison
  await api.v1.part.box({ id: partId, name: 'RefBox', length: 20, width: 20, height: 20 })

  const wcsId = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [80, 80, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Create cone at origin
  const coneId = (await api.v1.part.cone({
    id: partId, name: 'MoveCone', bDiameter: 40, tDiameter: 10, height: 60,
  })).result

  await snapshot('before-ref')

  // Move cone to WCS via updateCone
  await api.v1.part.openFeature({ id: coneId })
  const r = await api.v1.part.updateCone({ id: coneId, references: [wcsId] })
  await api.v1.part.closeFeature({ id: coneId })

  console.log('[13] add ref result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'add-ref-response')

  await snapshot('after-ref')

  // Remove references (back to origin)
  await api.v1.part.openFeature({ id: coneId })
  const r2 = await api.v1.part.updateCone({ id: coneId, references: [] })
  await api.v1.part.closeFeature({ id: coneId })

  console.log('[13] remove ref result:', r2.result, 'maxLevel:', r2.maxLevel)
  await snapshot('after-remove-ref')

  return { partId, coneId }
}
