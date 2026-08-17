export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossBoolTest' })).result

  // Create feature box (large)
  const featBoxId = (await api.v1.part.box({
    id: partId, name: 'MainBox', length: 100, width: 80, height: 60,
  })).result
  console.log('[04] feat box:', featBoxId)

  // Create another feature box (small, overlapping)
  const featBox2Id = (await api.v1.part.box({
    id: partId, name: 'ToolBox', length: 40, width: 40, height: 100,
  })).result
  console.log('[04] feat box2:', featBox2Id)

  await snapshot('before-boolean')

  // Try part.boolean (feature-based boolean) on two feature boxes
  const boolR = await api.v1.part.boolean({
    id: partId, name: 'SubBool',
    type: 'SUBTRACTION',
    target: featBoxId,
    tools: [featBox2Id],
  })
  console.log('[04] part.boolean result:', boolR.result, 'maxLevel:', boolR.maxLevel)
  filewrite({ result: boolR.result, messages: boolR.messages, maxLevel: boolR.maxLevel }, 'part-boolean-result')

  await snapshot('after-part-boolean')

  return { partId, featBoxId, featBox2Id, boolFeatureId: boolR.result }
}
