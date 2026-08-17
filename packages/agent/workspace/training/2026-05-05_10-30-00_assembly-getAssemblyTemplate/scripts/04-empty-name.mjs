export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Try empty-name lookup without any empty-named template
  const rNoEmpty = await api.v1.assembly.getAssemblyTemplate({ name: '' })
  console.log('[04] empty name (no template):', rNoEmpty.result, 'maxLevel:', rNoEmpty.maxLevel)

  // Create template with empty name
  const t1 = (await api.v1.assembly.assemblyTemplate({ name: '' })).result
  console.log('[04] created empty-name template:', t1)

  // Now look it up
  const rHasEmpty = await api.v1.assembly.getAssemblyTemplate({ name: '' })
  console.log('[04] empty name (template exists):', rHasEmpty.result, 'maxLevel:', rHasEmpty.maxLevel)

  filewrite({
    noEmptyTemplate: { result: rNoEmpty.result, maxLevel: rNoEmpty.maxLevel, messages: rNoEmpty.messages },
    afterCreate: { result: rHasEmpty.result, maxLevel: rHasEmpty.maxLevel },
    templateId: t1,
    matches: rHasEmpty.result === t1,
  }, 'empty-name-results')

  return { asmId }
}
