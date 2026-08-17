export default async function (api, { snapshot, filewrite }) {
  // Create two different source geometries
  const srcPart = (await api.v1.part.create({ name: 'Source1' })).result
  await api.v1.part.box({ id: srcPart, name: 'SmallBox', length: 20, width: 20, height: 20 })
  const stp1 = (await api.v1.common.save({ format: 'STP' })).result.content

  await api.v1.common.clear({})
  const srcPart2 = (await api.v1.part.create({ name: 'Source2' })).result
  await api.v1.part.cylinder({ id: srcPart2, name: 'BigCyl', radius: 25, height: 50 })
  const stp2 = (await api.v1.common.save({ format: 'STP' })).result.content

  // Create target and do two separate imports
  await api.v1.common.clear({})
  const tgtPart = (await api.v1.part.create({ name: 'MultiImport' })).result

  const r1 = await api.v1.part.importFeature({
    id: tgtPart, data: stp1, format: 'STP', name: 'Import1_Box',
  })
  console.log('[12] import1 result:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.importFeature({
    id: tgtPart, data: stp2, format: 'STP', name: 'Import2_Cyl',
  })
  console.log('[12] import2 result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Check structure
  const partNode = r2.structure?.tree?.[String(tgtPart)]
  console.log('[12] part solids after 2 imports:', partNode?.solids?.length)

  // Check entity set
  const entitySetId = partNode?.children?.find(cid => {
    const n = r2.structure?.tree?.[String(cid)]
    return n?.class === 'CC_EntitySet'
  })
  if (entitySetId) {
    const entitySet = r2.structure?.tree?.[String(entitySetId)]
    console.log('[12] entity set children:', entitySet?.children)
    for (const eid of entitySet?.children || []) {
      const en = r2.structure?.tree?.[String(eid)]
      console.log('[12]   entity', eid, ':', en?.class, en?.name)
    }
  }

  await snapshot('two-imports')

  filewrite({
    import1: r1.result, import2: r2.result,
    partSolids: partNode?.solids,
  }, 'multi-import')

  return { tgtPart }
}
