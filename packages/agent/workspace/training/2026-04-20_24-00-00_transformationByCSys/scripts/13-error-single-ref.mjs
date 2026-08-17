export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorSingleRef' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 20,
  })).result

  const wcs1 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    offset: [0, 0, 0],
  })).result

  // Error: only one WCS reference instead of two
  const r1 = await api.v1.part.transformationByCSys({
    id: partId,
    name: 'SingleRef',
    targets: [boxId],
    references: [wcs1],
  })

  console.log('[13] single ref result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'single-ref-response')

  // Error: empty references
  const r2 = await api.v1.part.transformationByCSys({
    id: partId,
    name: 'EmptyRef',
    targets: [boxId],
    references: [],
  })

  console.log('[13] empty ref result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'empty-ref-response')

  // Error: missing targets
  const r3 = await api.v1.part.transformationByCSys({
    id: partId,
    name: 'NoTargets',
    targets: [],
    references: [wcs1, wcs1],
  })

  console.log('[13] no targets result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'no-targets-response')

  return { partId }
}
