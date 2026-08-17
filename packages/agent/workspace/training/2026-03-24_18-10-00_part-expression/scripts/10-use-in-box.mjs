// Use expressions in a box feature via @expr.NAME syntax
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 120 },
      { name: 'W', value: 80 },
      { name: 'H', value: 'L / 2' },
    ],
  })

  const boxR = await api.v1.part.box({
    id: partId,
    name: 'ParamBox',
    length: '@expr.L',
    width: '@expr.W',
    height: '@expr.H',
  })
  console.log('[10] box result:', boxR.result, 'maxLevel:', boxR.maxLevel)

  await snapshot('param-box')
  return { partId, boxId: boxR.result }
}
