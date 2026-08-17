export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IgnoredParams' })).result

  // Test if part.box ignores the `translation` param by comparing
  // a box with translation vs one without
  const box1 = (await api.v1.part.box({
    id: partId, name: 'NoTrans', length: 40, width: 40, height: 40,
  })).result

  // Feature box WITH translation — does it move?
  const box2 = (await api.v1.part.box({
    id: partId, name: 'WithTrans', length: 40, width: 40, height: 40,
    translation: [100, 0, 0],
  })).result

  await snapshot('feat-trans-test')

  // Dump graphic to compare bounding data
  const r = await api.v1.common.getAppVersion({})
  filewrite(r.graphic, 'feat-trans-graphic')

  // Similarly, test if solid.box ignores `references`
  const partId2 = (await api.v1.part.create({ name: 'IgnoredParams2' })).result
  const wcsId = (await api.v1.part.workCSys({
    id: partId2, name: 'WCS1',
    origin: [100, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF1' })).result

  const solid1 = (await api.v1.solid.box({
    id: eifId, length: 40, width: 40, height: 40,
  })).result

  // Solid box WITH references — does it move?
  const solid2 = (await api.v1.solid.box({
    id: eifId, length: 40, width: 40, height: 40,
    references: [wcsId],
  })).result

  await snapshot('solid-ref-test')

  // If both solids overlap (same position), references was ignored
  const r2 = await api.v1.common.getAppVersion({})
  filewrite(r2.graphic, 'solid-ref-graphic')

  return { partId, partId2 }
}
