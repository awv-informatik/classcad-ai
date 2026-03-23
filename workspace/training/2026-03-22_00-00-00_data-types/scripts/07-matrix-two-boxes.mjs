// Q: Matrix translation layout — column vs row. Use two boxes to make translation visible.
// Create box, snapshot, then apply matrix and snapshot. The renderer keeps all solids visible.
// Use STEP export to check actual geometry positions.
export default async function ({ execute }, { snapshot, filewrite }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result

  // Create a small box
  const boxId = (await execute({
    'v1.part.box': [{ id: partId, xLen: 30, yLen: 30, zLen: 30 }]
  })).result

  // Apply column-format translation matrix to the part
  // According to docs: translation in last column [row][3]
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

  // Save to STEP and check coordinates
  const saveResult = await execute({
    'v1.common.save': [{ type: 'stp' }]
  })
  console.log('[07] save maxLevel:', saveResult.maxLevel)
  if (saveResult.result && saveResult.result.content) {
    // The STEP file is a string — look for CARTESIAN_POINT entries
    const content = saveResult.result.content
    const lines = content.split('\n').filter(l => l.includes('CARTESIAN_POINT'))
    console.log('[07] STEP cartesian points (col-format):')
    lines.forEach(l => console.log('  ', l.trim()))
  }

  // Now reset and test row format
  await execute({ 'v1.common.clear': [{}] })
  const partId2 = (await execute({ 'v1.part.create': [{ name: 'Test2' }] })).result
  await execute({ 'v1.part.box': [{ id: partId2, xLen: 30, yLen: 30, zLen: 30 }] })

  // Row-format translation
  await execute({
    'v1.common.transformObjectWithMatrix': [{
      id: partId2,
      matrix: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [100, 0, 0, 1]
      ]
    }]
  })

  const saveResult2 = await execute({
    'v1.common.save': [{ type: 'stp' }]
  })
  if (saveResult2.result && saveResult2.result.content) {
    const content2 = saveResult2.result.content
    const lines2 = content2.split('\n').filter(l => l.includes('CARTESIAN_POINT'))
    console.log('[07] STEP cartesian points (row-format):')
    lines2.forEach(l => console.log('  ', l.trim()))
  }

  return {}
}
