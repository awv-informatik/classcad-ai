export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeWrongRef' })).result

  // Try passing a work plane ID (should fail like part.box)
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'WP1',
    origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0],
  })).result

  const r = await api.v1.part.cone({ id: partId, name: 'BadRef', references: [wpId], bDiameter: 40, tDiameter: 10, height: 60 })

  console.log('[04] cone with workPlane ref result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'wrong-ref-response')

  return { partId }
}
