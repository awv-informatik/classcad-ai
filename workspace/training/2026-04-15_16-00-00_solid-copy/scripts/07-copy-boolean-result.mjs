// Copy a solid that is the result of a boolean operation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyBoolean' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a box with a cylinder subtracted
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 20, translation: [30, 20, -10] })).result
  await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cylId] })

  await snapshot('original-with-hole')

  // Copy the boolean result with translation
  const r = await api.v1.solid.copy({ id: eifId, target: boxId, translation: [80, 0, 0] })
  console.log('[07] copyId:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'copy-boolean-response')

  await snapshot('original-plus-copy')

  // Get graphic to verify both have same vertex count (hole preserved)
  const graphicR = await api.v1.solid.copy({ id: eifId, target: boxId, translation: [0, 80, 0] })
  filewrite(graphicR.graphic, 'graphic-3-bodies')

  return { partId, eifId, boxId, copyId: r.result }
}
