export default async function (api, { snapshot, filewrite }) {
  // Test batch instance creation and ident system
  const asmId = (await api.v1.assembly.create({ name: 'BatchTest' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Cube' })).result
  await api.v1.part.box({ id: tpl, name: 'Cube', length: 20, width: 20, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Batch create: pass array of params
  const batchResult = await api.v1.assembly.instance([
    { productId: tpl, ownerId: asmId, name: 'BatchA', ident: 'cube-a' },
    { productId: tpl, ownerId: asmId, name: 'BatchB', ident: 'cube-b',
      transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]],
    },
    { productId: tpl, ownerId: asmId, name: 'BatchC', ident: 'cube-c',
      transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
    },
  ])
  console.log('[10] batch result:', JSON.stringify(batchResult.result))
  console.log('[10] batch maxLevel:', batchResult.maxLevel)

  // Check that ident appears in structure
  const r = await api.v1.common.getAppVersion({})
  const tree = r.structure.tree

  // Find the instances and check for ident-related members
  const allInsts = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[10] all instances:', allInsts)

  for (const instId of allInsts) {
    const node = tree[instId]
    if (node) {
      console.log('[10] inst', instId, ':', node.name, 'class:', node.class)
      // Check for ident-related children or members
      if (node.children) {
        for (const childId of node.children) {
          const child = tree[childId]
          if (child) {
            console.log('    child', childId, ':', child.class, child.name)
            if (child.members) {
              for (const [k, v] of Object.entries(child.members)) {
                console.log('      ', k, ':', JSON.stringify(v).substring(0, 80))
              }
            }
          }
        }
      }
    }
  }

  // Test: can we use ident to find instances?
  // The docs mention ident as a "custom string identifier" — let's see if getInstance accepts it
  // Actually, getInstance uses name, not ident. Let's check the structure for IdentToIdMap
  for (const [nodeId, node] of Object.entries(tree)) {
    if (node.class && node.class.includes('Ident')) {
      console.log('[10] IdentMap node:', nodeId, node.class, node.name)
      if (node.members) {
        for (const [k, v] of Object.entries(node.members)) {
          console.log('    ', k, ':', JSON.stringify(v).substring(0, 80))
        }
      }
    }
  }

  return { asmId }
}
