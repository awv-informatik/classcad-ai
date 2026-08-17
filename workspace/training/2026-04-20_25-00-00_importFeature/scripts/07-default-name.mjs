export default async function (api, { filewrite }) {
  const srcPart = (await api.v1.part.create({ name: 'Source' })).result
  await api.v1.part.box({ id: srcPart, name: 'Box', length: 50, width: 40, height: 30 })
  const saveResult = await api.v1.common.save({ format: 'STP' })

  await api.v1.common.clear({})
  const tgtPart = (await api.v1.part.create({ name: 'Target' })).result

  // Import without name param
  const r = await api.v1.part.importFeature({
    id: tgtPart,
    data: saveResult.result.content,
    format: 'STP',
  })
  console.log('[07] importFeature result:', r.result, 'maxLevel:', r.maxLevel)

  // Check the structure tree to see what name was assigned
  const importNode = r.structure?.tree?.[String(r.result)]
  console.log('[07] import entity class:', importNode?.class, 'name:', importNode?.name)
  filewrite({ result: r.result, importName: importNode?.name, importClass: importNode?.class }, 'default-name')

  return { importId: r.result }
}
