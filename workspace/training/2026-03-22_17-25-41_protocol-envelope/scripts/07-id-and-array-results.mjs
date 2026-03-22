// 07 — Test ID and Array<id> result types
// part.create returns id, sketch.rectangle returns Array<id>

export default async function ({ execute }) {
  const part = await execute({ 'v1.part.create': [{ name: 'IDTest' }] })
  console.log('[id] part.create result:', part.result, typeof part.result)
  console.log('[id] part.create full envelope keys:', Object.keys(part))

  const sk = await execute({ 'v1.sketch.create': [{ id: part.result }] })
  console.log('[id] sketch.create result:', sk.result, typeof sk.result)

  const rect = await execute({
    'v1.sketch.rectangle': [{
      id: sk.result,
      startPos: [0, 0, 0],
      endPos: [50, 30, 0]
    }]
  })
  console.log('[array] sketch.rectangle result:', JSON.stringify(rect.result))
  console.log('[array] is array:', Array.isArray(rect.result))
  console.log('[array] element types:', rect.result?.map(x => typeof x))

  return {}
}
