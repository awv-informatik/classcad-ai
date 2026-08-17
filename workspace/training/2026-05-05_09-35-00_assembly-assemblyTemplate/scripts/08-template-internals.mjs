export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result
  const subAsmId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  console.log('[08] assembly template:', subAsmId)

  // Get detailed structure of the assembly template
  const r = await api.v1.assembly.setCurrentProduct({ id: subAsmId })
  const tree = r.structure?.tree || {}

  // Find the template node and its children
  const templateNode = tree[String(subAsmId)]
  console.log('[08] template node class:', templateNode?.class)
  console.log('[08] template node name:', templateNode?.name)
  console.log('[08] template node children:', JSON.stringify(templateNode?.children))

  // Inspect children
  if (templateNode?.children) {
    for (const childId of templateNode.children) {
      const child = tree[String(childId)]
      if (child) {
        console.log(`[08]   child ${childId}: class=${child.class}, name=${child.name}`)
      }
    }
  }

  // Compare with root assembly node structure
  const rootNode = tree[String(asmId)]
  console.log('[08] root assembly children:', JSON.stringify(rootNode?.children))
  if (rootNode?.children) {
    for (const childId of rootNode.children) {
      const child = tree[String(childId)]
      if (child) {
        console.log(`[08]   root child ${childId}: class=${child.class}, name=${child.name}`)
      }
    }
  }

  filewrite({ templateNode, rootNode }, 'template-vs-root')

  return { subAsmId }
}
