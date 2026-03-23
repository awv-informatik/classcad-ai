// Dump STEP file to inspect actual coordinate values after matrix transform
export default async function ({ execute }, { filewrite }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result
  await execute({ 'v1.part.box': [{ id: partId, xLen: 30, yLen: 30, zLen: 30 }] })

  // Column-format translation [100, 0, 0]
  await execute({
    'v1.common.transformObjectWithMatrix': [{
      id: partId,
      matrix: [
        [1, 0, 0, 100],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ]
    }]
  })

  const saveResult = await execute({ 'v1.common.save': [{ type: 'stp' }] })
  console.log('[08] save result keys:', Object.keys(saveResult.result || {}))
  console.log('[08] save result type:', typeof saveResult.result)

  if (saveResult.result) {
    if (typeof saveResult.result === 'string') {
      filewrite(saveResult.result, 'col-stp')
    } else if (saveResult.result.content) {
      filewrite(saveResult.result.content, 'col-stp')
    } else {
      filewrite(saveResult.result, 'col-stp-obj')
    }
  }

  return {}
}
