// Test fillet with no offset/radius — should default to 1/4 shortest line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletDefault' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Default fillet — no offset or radius
  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]] })
  console.log('[03] default fillet result:', JSON.stringify(r.result))
  console.log('[03] maxLevel:', r.maxLevel)
  // Shortest line is 60 units, so default offset should be 15

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'default-fillet-response')
  await snapshot('default-fillet')

  return { partId, filletResult: r.result }
}
