// Test: use named expressions as feature parameters (box dimensions)
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create expressions for box dimensions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 120 },
      { name: 'W', value: 80 },
      { name: 'H', value: 'L / 2' },
    ],
  })

  // Use expression names as string values in box params
  const boxR = await api.v1.part.box({
    id: partId,
    name: 'ParamBox',
    length: 'L',
    width: 'W',
    height: 'H',
  })
  console.log('[11] box result:', boxR.result, 'maxLevel:', boxR.maxLevel)

  await snapshot('param-box')

  return { partId }
}
