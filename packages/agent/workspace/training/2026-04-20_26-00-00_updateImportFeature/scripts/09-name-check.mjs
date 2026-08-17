export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create box STP
  await api.v1.part.box({ id: partId, length: 50, width: 40, height: 30 })
  const boxStp = (await api.v1.common.save({ format: 'STP' })).result.content
  await api.v1.common.clear({})

  // Create cylinder STP
  const p2 = (await api.v1.part.create({ name: 'Cyl' })).result
  await api.v1.part.cylinder({ id: p2, radius: 20, height: 50 })
  const cylStp = (await api.v1.common.save({ format: 'STP' })).result.content
  await api.v1.common.clear({})

  // Import box with specific name
  const p3 = (await api.v1.part.create({ name: 'Target' })).result
  const importId = (await api.v1.part.importFeature({
    id: p3,
    data: boxStp,
    format: 'STP',
    name: 'MyCustomName',
  })).result
  console.log('[09] importFeature result:', importId)

  // Dump structure to find how the name is stored
  const s1 = (await api.v1.common.recalc({})).structure
  filewrite(s1, 'structure-before')

  // Find the import node in the tree — scan for the import ID
  const findImportNode = (node, targetId) => {
    if (!node) return null
    if (node.id === targetId) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findImportNode(child, targetId)
        if (found) return found
      }
    }
    return null
  }
  const importNode = findImportNode(s1, importId)
  console.log('[09] import node name:', importNode?.name)
  console.log('[09] import node type:', importNode?.type)

  // Update data only, no name
  await api.v1.part.openFeature({ id: importId })
  await api.v1.part.updateImportFeature({
    id: importId,
    data: cylStp,
    format: 'STP',
  })
  await api.v1.part.closeFeature({ id: importId })

  const s2 = (await api.v1.common.recalc({})).structure
  const importNode2 = findImportNode(s2, importId)
  console.log('[09] name after data-only update:', importNode2?.name)

  // Update with name + data
  await api.v1.part.openFeature({ id: importId })
  await api.v1.part.updateImportFeature({
    id: importId,
    data: boxStp,
    format: 'STP',
    name: 'NewName',
  })
  await api.v1.part.closeFeature({ id: importId })

  const s3 = (await api.v1.common.recalc({})).structure
  const importNode3 = findImportNode(s3, importId)
  console.log('[09] name after name+data update:', importNode3?.name)

  filewrite({
    nameBefore: importNode?.name,
    nameAfterDataOnly: importNode2?.name,
    nameAfterNameAndData: importNode3?.name,
  }, 'name-results')

  return { partId: p3 }
}
