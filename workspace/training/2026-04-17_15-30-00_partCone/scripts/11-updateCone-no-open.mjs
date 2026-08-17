export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeNoOpen' })).result

  const coneId = (await api.v1.part.cone({
    id: partId, name: 'NoOpenCone', bDiameter: 60, tDiameter: 10, height: 80,
  })).result

  // Try updateCone WITHOUT openFeature — expect failure
  const r = await api.v1.part.updateCone({ id: coneId, height: 200 })
  console.log('[11] updateCone without open result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-open-response')

  return { partId, coneId }
}
