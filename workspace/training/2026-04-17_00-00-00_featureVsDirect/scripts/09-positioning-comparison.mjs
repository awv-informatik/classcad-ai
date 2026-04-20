export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PosCompare' })).result

  // Feature box with workCSys positioning
  const wcsId = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [50, 30, 20], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const featBoxId = (await api.v1.part.box({
    id: partId, name: 'FeatBox',
    references: [wcsId],
    length: 60, width: 40, height: 30,
  })).result
  console.log('[09] feat box at WCS:', featBoxId)

  // Solid box with translation/rotation positioning
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const solidBoxId = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 30,
    translation: [50, 30, 20],
  })).result
  console.log('[09] solid box with translation:', solidBoxId)

  await snapshot('positioning-comparison')

  // Can part.box use translation/rotation? (docs don't mention these params)
  const featBoxBadR = await api.v1.part.box({
    id: partId, name: 'FeatBox2',
    length: 30, width: 30, height: 30,
    translation: [0, 0, 100],
  })
  console.log('[09] part.box with translation:', featBoxBadR.result, 'maxLevel:', featBoxBadR.maxLevel)
  filewrite({ result: featBoxBadR.result, messages: featBoxBadR.messages, maxLevel: featBoxBadR.maxLevel }, 'feat-with-translation')

  // Can solid.box use references? (docs don't mention this param)
  const solidBoxBadR = await api.v1.solid.box({
    id: eifId, length: 30, width: 30, height: 30,
    references: [wcsId],
  })
  console.log('[09] solid.box with references:', solidBoxBadR.result, 'maxLevel:', solidBoxBadR.maxLevel)
  filewrite({ result: solidBoxBadR.result, messages: solidBoxBadR.messages, maxLevel: solidBoxBadR.maxLevel }, 'solid-with-references')

  await snapshot('cross-params')

  return { partId, featBoxId, solidBoxId, wcsId }
}
