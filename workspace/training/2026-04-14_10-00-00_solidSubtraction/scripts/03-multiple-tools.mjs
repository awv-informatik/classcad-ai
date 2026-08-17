// Test multiple tools in one subtraction call
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SubMultiTool' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box = (await api.v1.solid.box({
    id: eifId, length: 120, width: 80, height: 60
  })).result

  // Three cylinders at different positions
  const cyl1 = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 20,
    translation: [25, 40, -10]
  })).result

  const cyl2 = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 20,
    translation: [60, 40, -10]
  })).result

  const cyl3 = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 20,
    translation: [95, 40, -10]
  })).result

  console.log('[03] target:', box, 'tools:', [cyl1, cyl2, cyl3])
  await snapshot('before')

  const r = await api.v1.solid.subtraction({ id: eifId, target: box, tools: [cyl1, cyl2, cyl3] })
  console.log('[03] result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after')

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'multi-tools-result')

  return { partId }
}
