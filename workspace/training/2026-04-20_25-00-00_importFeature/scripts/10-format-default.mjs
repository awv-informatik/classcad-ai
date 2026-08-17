export default async function (api, { filewrite }) {
  const srcPart = (await api.v1.part.create({ name: 'Source' })).result
  await api.v1.part.box({ id: srcPart, name: 'Box', length: 50, width: 40, height: 30 })
  const saveResult = await api.v1.common.save({ format: 'STP' })

  await api.v1.common.clear({})
  const tgtPart = (await api.v1.part.create({ name: 'Target' })).result

  // Test 1: Import data without format param — does it default to STP?
  const r1 = await api.v1.part.importFeature({
    id: tgtPart,
    data: saveResult.result.content,
    name: 'NoFormatData',
  })
  console.log('[10-a] no format+data result:', r1.result, 'maxLevel:', r1.maxLevel)
  const importNode1 = r1.structure?.tree?.[String(r1.result)]
  console.log('[10-a] children:', importNode1?.children)
  const partNode1 = r1.structure?.tree?.[String(tgtPart)]
  console.log('[10-a] part solids:', partNode1?.solids)

  // Test 2: Import from file without format — should auto-detect from .stp extension
  await api.v1.common.clear({})
  const srcPart2 = (await api.v1.part.create({ name: 'Source2' })).result
  await api.v1.part.cylinder({ id: srcPart2, name: 'Cyl', radius: 15, height: 40 })
  await api.v1.common.save({ file: '/tmp/cc-test-noformat.stp' })

  await api.v1.common.clear({})
  const tgtPart2 = (await api.v1.part.create({ name: 'Target2' })).result

  const r2 = await api.v1.part.importFeature({
    id: tgtPart2,
    file: '/tmp/cc-test-noformat.stp',
    name: 'FileNoFormat',
  })
  console.log('[10-b] file no format result:', r2.result, 'maxLevel:', r2.maxLevel)
  const importNode2 = r2.structure?.tree?.[String(r2.result)]
  console.log('[10-b] children:', importNode2?.children)

  filewrite({
    noFormatData: { result: r1.result, maxLevel: r1.maxLevel, hasChildren: !!importNode1?.children?.length, solids: partNode1?.solids },
    fileNoFormat: { result: r2.result, maxLevel: r2.maxLevel, hasChildren: !!importNode2?.children?.length },
  }, 'format-defaults')

  return {}
}
