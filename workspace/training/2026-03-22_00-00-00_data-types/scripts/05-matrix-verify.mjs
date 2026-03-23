// Q: Which matrix layout actually moves geometry? Check via structure tree members
export default async function ({ execute }, { filewrite }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result
  const boxId = (await execute({
    'v1.part.box': [{ id: partId, xLen: 40, yLen: 40, zLen: 40 }]
  })).result

  // Check structure before transform
  const before = await execute({ 'v1.common.getAppVersion': [{}] })
  // Use the structure tree to find the part's coord system
  const partNode = before.structure.tree[String(partId)]
  console.log('[05] part members before:', JSON.stringify(partNode.members))

  // Apply translation in LAST COLUMN (standard math convention)
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

  const after1 = await execute({ 'v1.common.getAppVersion': [{}] })
  const partAfter1 = after1.structure.tree[String(partId)]
  console.log('[05] part members after col-translate:', JSON.stringify(partAfter1.members))

  // Reset
  await execute({ 'v1.common.clear': [{}] })
  const partId2 = (await execute({ 'v1.part.create': [{ name: 'Test2' }] })).result
  await execute({ 'v1.part.box': [{ id: partId2, xLen: 40, yLen: 40, zLen: 40 }] })

  // Apply translation in BOTTOM ROW (transposed convention)
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

  const after2 = await execute({ 'v1.common.getAppVersion': [{}] })
  const partAfter2 = after2.structure.tree[String(partId2)]
  console.log('[05] part members after row-translate:', JSON.stringify(partAfter2.members))

  // Compare — look for the coord system / origin values
  // Also dump the full tree entries for inspection
  filewrite(partAfter1, 'col-translate-structure')
  filewrite(partAfter2, 'row-translate-structure')

  return {}
}
