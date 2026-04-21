export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Import with invalid data — does it create geometry?
  const r = await api.v1.part.importFeature({
    id: partId,
    data: 'not-valid-stp-data',
    format: 'STP',
    name: 'BadDataImport',
  })
  console.log('[09] importFeature result:', r.result, 'maxLevel:', r.maxLevel)

  // Check structure: does the import entity have children?
  const importNode = r.structure?.tree?.[String(r.result)]
  console.log('[09] import class:', importNode?.class, 'name:', importNode?.name)
  console.log('[09] import children:', importNode?.children)

  // Check part solids
  const partNode = r.structure?.tree?.[String(partId)]
  console.log('[09] part solids:', partNode?.solids)

  filewrite({
    importNode: { class: importNode?.class, name: importNode?.name, children: importNode?.children },
    partSolids: partNode?.solids,
  }, 'bad-data-check')

  // Also test bad format
  const r2 = await api.v1.part.importFeature({
    id: partId,
    data: 'test',
    format: 'INVALID',
    name: 'BadFormatImport',
  })
  console.log('[09] bad format result:', r2.result, 'maxLevel:', r2.maxLevel)
  const importNode2 = r2.structure?.tree?.[String(r2.result)]
  console.log('[09] bad format children:', importNode2?.children)

  await snapshot('bad-data')

  return {}
}
