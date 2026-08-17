export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'IdTest' })).result
  console.log('[10] asmId:', asmId)

  // Create assembly templates to observe ID spacing
  const ids = []
  for (let i = 0; i < 5; i++) {
    const id = (await api.v1.assembly.assemblyTemplate({ name: `Sub${i}` })).result
    ids.push(id)
    console.log(`[10] Sub${i}:`, id)
  }

  console.log('[10] ID gaps:', ids.map((id, i) => i > 0 ? id - ids[i - 1] : null).filter(Boolean))

  // For comparison, create part templates
  const partIds = []
  for (let i = 0; i < 3; i++) {
    const id = (await api.v1.assembly.partTemplate({ name: `Part${i}` })).result
    partIds.push(id)
    console.log(`[10] Part${i}:`, id)
  }

  console.log('[10] Part ID gaps:', partIds.map((id, i) => i > 0 ? id - partIds[i - 1] : null).filter(Boolean))

  // Dump children of AssemblyContainer and PartContainer
  const r = await api.v1.assembly.getAssemblyTemplate()
  const tree = r.structure?.tree || {}
  const containers = Object.values(tree)
    .filter(n => ['CC_AssemblyContainer', 'CC_PartContainer'].includes(n.class))
    .map(n => ({ id: n.id, name: n.name, class: n.class, children: n.children }))
  filewrite(containers, 'container-children')

  return { asmId, asmTplIds: ids, partTplIds: partIds }
}
