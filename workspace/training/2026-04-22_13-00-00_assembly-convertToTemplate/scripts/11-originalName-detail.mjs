export default async function (api, { filewrite }) {
  // Deep dive on originalName behavior
  // Q: Does convertToTemplate change the name member, or does it set originalName?
  // From script 06: originalName retained "Root" (the assembly.create name), while name changed

  const asmId = (await api.v1.assembly.create({ name: 'OrigRoot' })).result

  // Check original root members before conversion
  const beforeR = await api.v1.common.getAppVersion({})
  const rootBefore = beforeR.structure?.tree?.[String(asmId)]
  console.log('[11] BEFORE — name:', rootBefore?.name, 'class:', rootBefore?.class)
  console.log('[11] BEFORE — originalName:', rootBefore?.members?.originalName?.value)

  // Convert with a custom name
  const r = await api.v1.assembly.convertToTemplate({ name: 'RenamedSub' })
  const newRoot = r.structure?.root
  const convertedNode = r.structure?.tree?.[String(asmId)]
  console.log('[11] AFTER — name:', convertedNode?.name, 'class:', convertedNode?.class)
  console.log('[11] AFTER — originalName:', convertedNode?.members?.originalName?.value)

  // Check the new root's names
  const newRootNode = r.structure?.tree?.[String(newRoot)]
  console.log('[11] NEW ROOT — name:', newRootNode?.name, 'originalName:', newRootNode?.members?.originalName?.value)

  filewrite({
    before: { name: rootBefore?.name, originalName: rootBefore?.members?.originalName?.value, class: rootBefore?.class },
    after: { name: convertedNode?.name, originalName: convertedNode?.members?.originalName?.value, class: convertedNode?.class },
    newRoot: { name: newRootNode?.name, originalName: newRootNode?.members?.originalName?.value },
  }, 'originalName-detail')

  return {}
}
