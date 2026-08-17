// Test basic fillet with offset parameter on two connected lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle to get connected lines
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  console.log('[01] rectangle result:', JSON.stringify(rect.result))
  console.log('[01] rectangle maxLevel:', rect.maxLevel)

  // Rectangle returns line IDs — pick two adjacent lines
  const lineIds = rect.result
  console.log('[01] lineIds count:', lineIds.length)

  await snapshot('before-fillet')

  // Fillet with offset=10 on first two lines
  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 10 })
  console.log('[01] fillet result:', JSON.stringify(r.result))
  console.log('[01] fillet maxLevel:', r.maxLevel)
  console.log('[01] fillet messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'fillet-response')

  await snapshot('after-fillet')

  return { partId, skId, filletResult: r.result }
}
