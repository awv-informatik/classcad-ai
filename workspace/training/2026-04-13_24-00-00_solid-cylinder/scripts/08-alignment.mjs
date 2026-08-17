// Test cylinder alignment — is it centered or corner-aligned?
// Place a box alongside for reference
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylinderAlignment' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Cylinder at origin
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 80, diameter: 60 })).result
  console.log('[08] cylinder id:', cylId)

  // Box at origin for alignment reference
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 60, height: 80, translation: [80, 0, 0] })).result
  console.log('[08] box id:', boxId)

  await snapshot('alignment-comparison')

  // Get graphic data to check bounding box / vertex positions
  // Just log the structure to understand alignment
  const r = await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 40, translation: [0, 0, 100] })
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'stacked-response')

  await snapshot('stacked')
  return { partId, eifId, cylId, boxId }
}
