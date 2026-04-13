// Basic sphere creation — test the happy path with just radius
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const r = await api.v1.solid.sphere({ id: eifId, radius: 50 })
  console.log('[01] sphere result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'sphere-response')

  // Capture graphic data for vertex/face analysis
  filewrite({ vertexCount: r.graphic?.vertices?.length, edgeCount: r.graphic?.edges?.length }, 'sphere-graphic-summary')

  await snapshot('basic-sphere')

  return { partId, eifId, sphereId: r.result }
}
