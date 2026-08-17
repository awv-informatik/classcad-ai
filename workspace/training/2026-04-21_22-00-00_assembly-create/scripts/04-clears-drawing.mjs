export default async function (api, { filewrite }) {
  // First create a part to see if assembly.create clears it
  const partR = await api.v1.part.create({ name: 'TestPart' })
  console.log('[04] part.create result:', partR.result, 'maxLevel:', partR.maxLevel)

  const beforeKeys = Object.keys(partR.structure.tree)
  console.log('[04] tree node count after part.create:', beforeKeys.length)

  // Now create an assembly — does it clear the part?
  const asmR = await api.v1.assembly.create({ name: 'ClearTest' })
  console.log('[04] assembly.create result:', asmR.result, 'maxLevel:', asmR.maxLevel)

  const afterKeys = Object.keys(asmR.structure.tree)
  console.log('[04] tree node count after assembly.create:', afterKeys.length)

  // Check if the part still exists
  const partStillExists = asmR.structure.tree[partR.result] !== undefined
  console.log('[04] part still exists after assembly.create:', partStillExists)

  filewrite({
    partId: partR.result,
    asmId: asmR.result,
    beforeNodeCount: beforeKeys.length,
    afterNodeCount: afterKeys.length,
    partStillExists,
    afterNodeIds: afterKeys,
  }, 'clears-drawing')

  return { asmId: asmR.result }
}
