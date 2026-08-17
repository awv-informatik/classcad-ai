export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Multiple unnamed calls — check auto-increment naming
  const t1 = (await api.v1.assembly.assemblyTemplate()).result
  const t2 = (await api.v1.assembly.assemblyTemplate()).result
  const t3 = (await api.v1.assembly.assemblyTemplate()).result
  console.log('[02] unnamed templates:', t1, t2, t3)

  // Duplicate named calls
  const t4 = (await api.v1.assembly.assemblyTemplate({ name: 'Motor' })).result
  const t5 = (await api.v1.assembly.assemblyTemplate({ name: 'Motor' })).result
  const t6 = (await api.v1.assembly.assemblyTemplate({ name: 'Motor' })).result
  console.log('[02] duplicate names:', t4, t5, t6)

  // Empty string name
  const t7 = (await api.v1.assembly.assemblyTemplate({ name: '' })).result
  console.log('[02] empty name template:', t7)

  // Special characters
  const t8 = (await api.v1.assembly.assemblyTemplate({ name: 'Sub (v2)/test' })).result
  console.log('[02] special chars template:', t8)

  // Retrieve all from getAssemblyTemplate to see names
  const all = await api.v1.assembly.getAssemblyTemplate()
  console.log('[02] getAssemblyTemplate() all:', JSON.stringify(all.result))

  // Dump structure focused on AssemblyContainer children
  const tree = all.structure?.tree || {}
  const names = Object.values(tree)
    .filter(n => n.class === 'CC_Assembly' && n.parent === 10)
    .map(n => ({ id: n.id, name: n.name, originalName: n.members?.originalName?.value }))
  filewrite(names, 'assembly-template-names')

  return { t1, t2, t3, t4, t5, t6, t7, t8 }
}
