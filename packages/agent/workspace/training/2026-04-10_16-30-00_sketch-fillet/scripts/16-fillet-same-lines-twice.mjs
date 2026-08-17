// Try to fillet the same pair of lines twice — does it create a second fillet or error?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DoubleFillet' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // First fillet
  const r1 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 10 })
  console.log('[16] first fillet:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Second fillet on same lines
  const r2 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 5 })
  console.log('[16] second fillet:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  console.log('[16] second fillet messages:', JSON.stringify(r2.messages))

  filewrite({ first: r1.result, second: r2.result, secondMessages: r2.messages, secondMaxLevel: r2.maxLevel }, 'double-fillet-results')
  await snapshot('double-fillet')

  return { partId }
}
