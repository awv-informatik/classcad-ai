// Test: CUSTOM with offset + rotation combined
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const r = await api.v1.part.workCSys({
    id: partId,
    name: 'CS_both',
    offset: [50, 30, 20],
    rotation: [0, 0, Math.PI / 4]  // 45° around Z
  })
  console.log('[04] both result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'both-response')

  await snapshot('offset-rotation')
  return { partId }
}
