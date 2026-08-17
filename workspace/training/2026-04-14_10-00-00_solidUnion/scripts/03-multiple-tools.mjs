// 03 — Union with multiple tools in one call
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UnionMultiTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Base box
  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 60, height: 40
  })).result

  // Tool 1: overlapping in X+Y
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 50, width: 40, height: 60,
    translation: [70, 30, 0]
  })).result

  // Tool 2: overlapping in Z (tall column)
  const cyl = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 30,
    translation: [50, 30, 0]
  })).result

  console.log('[03] box1:', box1, 'box2:', box2, 'cyl:', cyl)

  await snapshot('before-multi-union')

  // Union with two tools at once
  const r = await api.v1.solid.union({ id: eifId, target: box1, tools: [box2, cyl] })
  console.log('[03] union result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'multi-tools-response')

  await snapshot('after-multi-union')

  return { partId, eifId }
}
