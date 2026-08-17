// Basic intersection of two overlapping boxes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionBasic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box1: 100x80x60 at origin
  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  // Box2: 60x40x80, overlapping box1 partially
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80,
    translation: [60, 30, -10]
  })).result

  console.log('[01] box1:', box1, 'box2:', box2)
  await snapshot('before')

  // Intersection
  const r = await api.v1.solid.intersection({ id: eifId, target: box1, tools: [box2] })
  console.log('[01] intersection result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'intersection-response')

  await snapshot('after')

  // Check if box2 is still accessible (should be consumed by default)
  try {
    const copyR = await api.v1.solid.copy({ id: eifId, solid: box2 })
    console.log('[01] box2 still valid after intersection:', copyR.result, 'maxLevel:', copyR.maxLevel)
  } catch (e) {
    console.log('[01] box2 error after intersection:', e.message)
  }

  return { partId, result: r.result, box1, box2 }
}
