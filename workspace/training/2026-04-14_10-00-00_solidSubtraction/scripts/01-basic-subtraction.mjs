// Basic subtraction: cut a smaller box from a larger box
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SubBasic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Large base box
  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result
  console.log('[01] box1:', box1)

  // Smaller tool box, offset to cut a corner
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 40, width: 30, height: 80,
    translation: [70, 55, -10]
  })).result
  console.log('[01] box2:', box2)

  await snapshot('before')

  // Subtract box2 from box1
  const r = await api.v1.solid.subtraction({ id: eifId, target: box1, tools: [box2] })
  console.log('[01] subtraction result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'subtraction-result')

  await snapshot('after')

  // Check if box2 is still valid by trying to reference it
  try {
    const copyR = await api.v1.solid.copy({ id: eifId, solid: box2 })
    console.log('[01] box2 after subtraction — copy result:', copyR.result, 'maxLevel:', copyR.maxLevel)
  } catch (e) {
    console.log('[01] box2 after subtraction — error:', e.message)
  }

  return { partId, eifId, box1 }
}
