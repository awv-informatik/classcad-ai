export default async function (api, { snapshot, filewrite }) {
  // Create a bracket shape and save as STEP
  const srcPart = (await api.v1.part.create({ name: 'Bracket' })).result
  const boxId = (await api.v1.part.box({
    id: srcPart, name: 'BracketBase', length: 60, width: 40, height: 10,
  })).result
  const cylId = (await api.v1.part.cylinder({
    id: srcPart, name: 'BracketPost', radius: 8, height: 40,
    position: [30, 20, 10],
  })).result
  await api.v1.part.boolean({
    id: srcPart, name: 'BracketUnion', type: 'UNION',
    target: boxId, tools: [cylId],
  })
  const saveResult = await api.v1.common.save({ format: 'STP' })
  console.log('[11] bracket STP saved, data length:', saveResult.result.content?.length)

  // Clear and create a new part with a base plate
  await api.v1.common.clear({})
  const tgtPart = (await api.v1.part.create({ name: 'Assembly' })).result
  const plateId = (await api.v1.part.box({
    id: tgtPart, name: 'BasePlate', length: 100, width: 80, height: 5,
  })).result

  await snapshot('before-import')

  // Import the bracket
  const importResult = await api.v1.part.importFeature({
    id: tgtPart,
    data: saveResult.result.content,
    format: 'STP',
    name: 'ImportedBracket',
  })
  console.log('[11] import result:', importResult.result, 'maxLevel:', importResult.maxLevel)

  // Check how many solids are in the part now
  const partNode = importResult.structure?.tree?.[String(tgtPart)]
  console.log('[11] part solids after import:', partNode?.solids?.length)

  await snapshot('after-import')

  filewrite({
    importId: importResult.result,
    partSolids: partNode?.solids,
  }, 'realistic-result')

  return { tgtPart, importId: importResult.result }
}
