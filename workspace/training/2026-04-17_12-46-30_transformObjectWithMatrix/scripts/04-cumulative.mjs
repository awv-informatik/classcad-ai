export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CumulativeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10, translation: [-30, -30, 0] })).result

  await snapshot('before')

  // First transform: translate [50, 0, 0]
  const r1 = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [1, 0, 0, 50],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[04] first transform - maxLevel:', r1.maxLevel)

  await snapshot('after-first')

  // Second transform: translate [50, 0, 0] again
  // If cumulative: box at [100, 0, 0]
  // If absolute: box at [50, 0, 0] (no additional effect)
  const r2 = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [1, 0, 0, 50],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[04] second transform - maxLevel:', r2.maxLevel)

  await snapshot('after-second')

  // Save STEP to verify positions
  const step = await api.v1.common.save({ format: 'STP' })
  filewrite(step.result.content, 'cumulative-step')

  return { partId, eifId, boxId }
}
