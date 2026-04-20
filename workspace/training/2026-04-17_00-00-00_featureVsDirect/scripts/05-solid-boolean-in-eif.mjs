export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SolidBoolTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Create two solid boxes
  const solidBox1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60,
  })).result
  const solidBox2 = (await api.v1.solid.box({
    id: eifId, length: 40, width: 40, height: 100,
  })).result
  console.log('[05] solid boxes:', solidBox1, solidBox2)

  await snapshot('before-solid-boolean')

  // solid.subtraction
  const subR = await api.v1.solid.subtraction({
    id: eifId, target: solidBox1, tools: [solidBox2],
  })
  console.log('[05] solid.subtraction result:', subR.result, 'maxLevel:', subR.maxLevel)
  filewrite({ result: subR.result, messages: subR.messages, maxLevel: subR.maxLevel }, 'solid-subtraction-result')

  await snapshot('after-solid-boolean')

  return { partId, eifId, solidBox1, solidBox2 }
}
