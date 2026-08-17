export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'StructTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'P1' })).result
  await api.v1.part.box({ id: tpl1, name: 'B', length: 20, width: 20, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'I2',
    transformation: [[40, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const groupId = (await api.v1.assembly.group({
    id: asmId, name: 'StructGroup', instanceIds: [inst1, inst2],
  })).result

  // Get the structure tree from the group creation response
  const r = await api.v1.assembly.getGroup({ id: asmId, name: 'StructGroup' })
  filewrite(r, 'getGroup-full-response')

  // Get structure via a dummy call to see the structure tree
  const structR = await api.v1.assembly.group({
    id: asmId, name: 'StructGroup2', instanceIds: [inst1],
  })

  // Inspect the structure tree for group nodes
  if (structR.structure) {
    const findGroupNodes = (node, path = '') => {
      const results = []
      const className = node.className || node.type || ''
      if (className.toLowerCase().includes('group') || className.toLowerCase().includes('constraint')) {
        results.push({ path, className, id: node.id, name: node.name, keys: Object.keys(node) })
      }
      if (node.children) {
        for (const child of node.children) {
          results.push(...findGroupNodes(child, `${path}/${child.name || child.className || '?'}`))
        }
      }
      return results
    }
    const groupNodes = findGroupNodes(structR.structure)
    console.log('[08] group-related nodes:', groupNodes.length)
    for (const n of groupNodes) {
      console.log('[08]  -', n.path, n.className, 'id:', n.id)
    }
    filewrite(groupNodes, 'group-nodes')

    // Also dump relevant part of structure
    if (structR.structure.children) {
      const constraintSet = structR.structure.children.find(c =>
        (c.className || '').includes('Constraint') || (c.name || '').includes('Constraint')
      )
      if (constraintSet) {
        filewrite(constraintSet, 'constraint-set')
      }
    }
  }

  // Check: does updateGroup need openFeature/closeFeature?
  // (Relations typically don't)
  const r2 = await api.v1.assembly.updateGroup({
    id: groupId, name: 'UpdatedNoOpen',
  })
  console.log('[08] updateGroup without openFeature — result:', r2.result, 'maxLevel:', r2.maxLevel)
  const verify = (await api.v1.assembly.getGroup({ id: asmId, name: 'UpdatedNoOpen' })).result
  console.log('[08] verified update:', JSON.stringify(verify))

  return { asmId, groupId }
}
