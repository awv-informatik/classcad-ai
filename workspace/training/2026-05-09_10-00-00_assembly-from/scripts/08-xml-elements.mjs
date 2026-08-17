// Test: try different XML root/child element names matching ClassCAD types
import { writeFileSync } from 'fs'

export default async function (api, { snapshot, filewrite }) {
  console.log('[08] Testing XML with ClassCAD type names as elements...')

  const ofbPath = '/tmp/cc-test-box.ofb'

  // Test different root element names
  const rootElements = [
    'AssemblyRoot', 'CC_AssemblyRoot', 'assembly', 'Assembly',
    'Product', 'product', 'Model', 'model', 'AllObjects',
    'CC_AllObjects', 'Document', 'document', 'Root', 'root',
  ]

  for (const rootEl of rootElements) {
    await api.v1.common.clear({})
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<${rootEl} name="TestAsm">
  <part name="Box" file="${ofbPath}"/>
</${rootEl}>`
    const r = await api.v1.assembly.from({ data: xml, format: 'ECXML' })
    const warnings = r.messages?.filter(m => m.level === 41).map(m => m.message) || []
    const errors = r.messages?.filter(m => m.level >= 51).map(m => m.message) || []
    const skipped = warnings.some(w => w.includes('not implemented'))
    console.log(`[08] <${rootEl}>: maxLevel:${r.maxLevel} result:${r.result} skipped:${skipped}`)
    if (!skipped && r.maxLevel <= 41) {
      console.log(`[08] ★ ROOT ELEMENT '${rootEl}' was recognized!`)
      filewrite({ rootEl, result: r.result, messages: r.messages, maxLevel: r.maxLevel }, `found-${rootEl}`)
    }
  }

  // Also try a structure that looks like the internal tree:
  // AllObjects > CC_PartContainer > CC_Part + CC_AssemblyRoot > CC_ProductReference
  await api.v1.common.clear({})
  const xmlTree = `<?xml version="1.0" encoding="UTF-8"?>
<AllObjects>
  <CC_PartContainer>
    <CC_Part name="Box" file="${ofbPath}"/>
  </CC_PartContainer>
  <CC_AssemblyRoot name="TestAsm">
    <CC_ProductReference product="Box"/>
  </CC_AssemblyRoot>
</AllObjects>`
  const rTree = await api.v1.assembly.from({ data: xmlTree, format: 'ECXML' })
  console.log('[08] Full tree XML:', 'result:', rTree.result, 'maxLevel:', rTree.maxLevel)
  if (rTree.messages?.length) {
    for (const m of rTree.messages) {
      console.log('[08]  ', m.levelStr, ':', m.message.substring(0, 120))
    }
  }
  filewrite({ result: rTree.result, messages: rTree.messages, maxLevel: rTree.maxLevel }, 'full-tree')

  return {}
}
