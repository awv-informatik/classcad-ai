// Q: Check work point Origin position after matrix transforms to determine layout
export default async function ({ execute }, { filewrite }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result

  // Work point "Origin" is at ID 22 (from prior training)
  const originId = 22

  // Check origin members before
  const r0 = await execute({ 'v1.common.getAppVersion': [{}] })
  const originBefore = r0.structure.tree[String(originId)]
  console.log('[06] Origin before:', JSON.stringify(originBefore.members))

  // Test 1: Column-translation matrix [1,0,0,Tx; 0,1,0,Ty; 0,0,1,Tz; 0,0,0,1]
  await execute({
    'v1.common.transformObjectWithMatrix': [{
      id: partId,
      matrix: [
        [1, 0, 0, 100],
        [0, 1, 0, 200],
        [0, 0, 1, 300],
        [0, 0, 0, 1]
      ]
    }]
  })

  const r1 = await execute({ 'v1.common.getAppVersion': [{}] })
  const originAfterCol = r1.structure.tree[String(originId)]
  console.log('[06] Origin after col-translate:', JSON.stringify(originAfterCol.members))

  // Reset
  await execute({ 'v1.common.clear': [{}] })
  const partId2 = (await execute({ 'v1.part.create': [{ name: 'Test2' }] })).result

  // Test 2: Row-translation matrix [1,0,0,0; 0,1,0,0; 0,0,1,0; Tx,Ty,Tz,1]
  await execute({
    'v1.common.transformObjectWithMatrix': [{
      id: partId2,
      matrix: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [100, 200, 300, 1]
      ]
    }]
  })

  const r2 = await execute({ 'v1.common.getAppVersion': [{}] })
  const originAfterRow = r2.structure.tree[String(22)]
  console.log('[06] Origin after row-translate:', JSON.stringify(originAfterRow.members))

  // Dump full origin node details
  filewrite(originAfterCol, 'origin-after-col')
  filewrite(originAfterRow, 'origin-after-row')

  return {}
}
