// Verify the copy can be used as a target/tool in boolean operations
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyBoolTool' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a big box and a small cylinder
  const bigBox = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const cyl = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 15, translation: [20, 20, -5] })).result

  // Copy the cylinder (to be used as a second tool)
  const cylCopy = (await api.v1.solid.copy({ id: eifId, target: cyl, translation: [30, 0, 0] })).result
  console.log('[14] cyl:', cyl, 'cylCopy:', cylCopy)

  await snapshot('before-boolean')

  // Subtract BOTH cylinders from the box
  const r = await api.v1.solid.subtraction({ id: eifId, target: bigBox, tools: [cyl, cylCopy] })
  console.log('[14] subtraction result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'boolean-with-copy-response')

  await snapshot('after-boolean')
  return { partId, eifId }
}
