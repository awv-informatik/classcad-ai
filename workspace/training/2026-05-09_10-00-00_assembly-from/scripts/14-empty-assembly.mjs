// Test: what does an empty assembly from JSON look like?
// Does it clear the drawing? Does it create a usable root?
export default async function (api, { snapshot, filewrite }) {
  console.log('[14] Testing empty assembly from JSON...')

  // Test 1: Does from() clear existing content?
  // Create a part first
  const partId = (await api.v1.part.create({ name: 'ExistingPart' })).result
  await api.v1.part.box({ id: partId, name: 'B1', length: 40, width: 30, height: 20 })
  console.log('[14] Created existing part:', partId)

  // Now call from() with empty arrays
  const r1 = await api.v1.assembly.from({
    data: JSON.stringify({ templates: [], instances: [], constraints: [] }),
    format: 'JSON',
  })
  console.log('[14] from() result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite(r1.structure, 'structure-after-from')

  // Check what's in the structure tree
  const tree = r1.structure?.tree || {}
  const classes = Object.values(tree).map(n => `${n.class}:${n.name}(${n.id})`)
  console.log('[14] Tree nodes:', classes.join(', '))
  filewrite(classes, 'tree-classes')

  // Was the existing part preserved?
  const hasPart = Object.values(tree).some(n => n.class === 'CC_Part' && n.name === 'ExistingPart')
  console.log('[14] Existing part preserved?', hasPart)

  // Can we use the root assembly?
  const asmRoot = Object.values(tree).find(n => n.class === 'CC_AssemblyRoot')
  console.log('[14] Assembly root:', asmRoot?.id, asmRoot?.name)

  // Test 2: Can we add templates and instances to this from()-created assembly?
  if (asmRoot) {
    const tplId = (await api.v1.assembly.partTemplate({ name: 'NewBox' })).result
    console.log('[14] Created template in from()-assembly:', tplId)

    if (tplId) {
      await api.v1.part.box({ id: tplId, name: 'B2', length: 60, width: 40, height: 30 })
      await api.v1.assembly.setCurrentProduct({ id: asmRoot.id })
      const inst = (await api.v1.assembly.instance({
        productId: tplId, ownerId: asmRoot.id, name: 'I1',
      })).result
      console.log('[14] Created instance:', inst)
      await snapshot('from-then-build')
    }
  }

  // Test 3: Call from() again — does it replace or add?
  const r2 = await api.v1.assembly.from({
    data: JSON.stringify({ templates: [], instances: [], constraints: [] }),
    format: 'JSON',
  })
  console.log('[14] Second from():', r2.result, 'maxLevel:', r2.maxLevel)
  const tree2 = r2.structure?.tree || {}
  const hasNewBox = Object.values(tree2).some(n => n.class === 'CC_Part' && n.name === 'NewBox')
  const asmRoots = Object.values(tree2).filter(n => n.class === 'CC_AssemblyRoot')
  console.log('[14] After 2nd from: NewBox preserved?', hasNewBox, '| assembly roots:', asmRoots.length)
  filewrite(Object.values(tree2).map(n => `${n.class}:${n.name}(${n.id})`), 'tree-after-second')

  return { r1: r1.result, r2: r2.result }
}
