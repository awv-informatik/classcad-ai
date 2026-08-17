export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixTest' })).result

  // Create a feature box
  const featBoxId = (await api.v1.part.box({
    id: partId, name: 'FeatBox', length: 100, width: 80, height: 60,
  })).result

  // Create EIF with a solid box in the same part
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const solidBoxId = (await api.v1.solid.box({
    id: eifId, length: 40, width: 40, height: 100,
  })).result

  await snapshot('mixed-before')

  // Try part.boolean with a feature box as target and solid box as tool
  // This tests cross-paradigm boolean
  const crossBoolR = await api.v1.part.boolean({
    id: partId, name: 'CrossBool',
    type: 'SUBTRACTION',
    target: featBoxId,
    tools: [solidBoxId],
  })
  console.log('[06] cross-paradigm part.boolean result:', crossBoolR.result, 'maxLevel:', crossBoolR.maxLevel)
  filewrite({ result: crossBoolR.result, messages: crossBoolR.messages, maxLevel: crossBoolR.maxLevel }, 'cross-bool-result')

  if (crossBoolR.result) {
    await snapshot('cross-bool-after')
  }

  // Try the reverse: solid.subtraction using feature box ID
  const partId2 = (await api.v1.part.create({ name: 'MixTest2' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF2' })).result
  const solidBox2 = (await api.v1.solid.box({
    id: eifId2, length: 100, width: 80, height: 60,
  })).result

  const featBox2 = (await api.v1.part.box({
    id: partId2, name: 'FeatTool', length: 40, width: 40, height: 100,
  })).result

  const reverseBoolR = await api.v1.solid.subtraction({
    id: eifId2, target: solidBox2, tools: [featBox2],
  })
  console.log('[06] reverse cross-paradigm solid.subtraction result:', reverseBoolR.result, 'maxLevel:', reverseBoolR.maxLevel)
  filewrite({ result: reverseBoolR.result, messages: reverseBoolR.messages, maxLevel: reverseBoolR.maxLevel }, 'reverse-cross-bool-result')

  return { featBoxId, solidBoxId, crossBoolR: crossBoolR.result }
}
