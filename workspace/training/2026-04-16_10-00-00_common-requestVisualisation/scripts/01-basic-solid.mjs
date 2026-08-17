// Test requestVisualisation with a basic solid box
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  console.log('[01] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Call requestVisualisation with the solid ID
  const r = await api.v1.common.requestVisualisation({ ids: [boxId] })
  console.log('[01] result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  console.log('[01] has graphic:', r.graphic !== null && r.graphic !== undefined)
  console.log('[01] envelope keys:', Object.keys(r))

  // Dump the full response (minus huge graphic if present)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'response-meta')

  // Dump graphic separately
  if (r.graphic) {
    // Just dump top-level keys and container count, not the full mesh data
    const graphicSummary = {
      topKeys: Object.keys(r.graphic),
      containerCount: r.graphic.containers ? r.graphic.containers.length : 'no containers key',
    }
    console.log('[01] graphic top keys:', Object.keys(r.graphic))
    if (r.graphic.containers && r.graphic.containers.length > 0) {
      const c0 = r.graphic.containers[0]
      graphicSummary.container0Keys = Object.keys(c0)
      console.log('[01] container[0] keys:', Object.keys(c0))
      if (c0.properties) {
        graphicSummary.container0Properties = c0.properties
        console.log('[01] container[0] properties keys:', Object.keys(c0.properties))
      }
    }
    filewrite(graphicSummary, 'graphic-summary')
    filewrite(r.graphic, 'graphic-full')
  }

  await snapshot('after-reqvis')
  return { partId, eifId, boxId }
}
