// Safe keepTools verification — test keepTools:true by doing a second subtraction with the same tool
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SubKeepSafe' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  const box2 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60,
    translation: [0, 0, 30]
  })).result

  // Tool cylinder
  const cyl = (await api.v1.solid.cylinder({
    id: eifId, height: 120, diameter: 25,
    translation: [50, 40, -10]
  })).result

  console.log('[09] box1:', box1, 'box2:', box2, 'tool:', cyl)

  // Subtract from box1 with keepTools: true
  const r1 = await api.v1.solid.subtraction({ id: eifId, target: box1, tools: [cyl], keepTools: true })
  console.log('[09] sub from box1 — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Now use the SAME tool to subtract from box2 — only possible if keepTools worked
  const r2 = await api.v1.solid.subtraction({ id: eifId, target: box2, tools: [cyl] })
  console.log('[09] sub from box2 (reuse tool) — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[09] messages:', JSON.stringify(r2.messages))

  await snapshot('result')

  filewrite({
    sub1: { result: r1.result, maxLevel: r1.maxLevel },
    sub2: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'keeptools-reuse')

  return { partId }
}
