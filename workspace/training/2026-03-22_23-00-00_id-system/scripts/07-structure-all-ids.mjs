// Q: What are all the objects in the tree after part.create? After box? What is ID 50? What class is boxId?
export default async function (api) {
  const r1 = await api.v1.part.create({ name: 'TestPart' })
  const partId = r1.result
  const tree1 = r1.structure?.tree || {}

  // List all objects after part.create
  console.log('[07] === After part.create ===')
  for (const [key, node] of Object.entries(tree1)) {
    console.log(`[07] id=${node.id} class=${node.class} name="${node.name}" parent=${node.parent} children=${JSON.stringify(node.children || [])}`)
  }
  console.log('[07] total objects:', Object.keys(tree1).length)
  console.log('[07] structure.root:', r1.structure?.root)

  // Add a box
  const boxR = await api.v1.part.box({ id: partId, name: 'MyBox' })
  const boxId = boxR.result
  const tree2 = boxR.structure?.tree || {}
  console.log('\n[07] === After box (showing new entries only) ===')
  for (const [key, node] of Object.entries(tree2)) {
    if (!tree1[key]) {
      console.log(`[07] NEW id=${node.id} class=${node.class} name="${node.name}" parent=${node.parent} children=${JSON.stringify(node.children || [])}`)
    }
  }
  console.log('[07] boxId returned:', boxId)
  console.log('[07] box in tree:', JSON.stringify(tree2[String(boxId)]?.class))
  console.log('[07] new objects count:', Object.keys(tree2).length - Object.keys(tree1).length)

  // What's ID 50?
  console.log('[07] id50:', JSON.stringify(tree1['50'] || tree2['50']))
}
