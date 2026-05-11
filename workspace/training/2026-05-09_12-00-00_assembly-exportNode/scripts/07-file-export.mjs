export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.box({ id: tplId, name: 'Box1', length: 60, width: 40, height: 30 })

  // Export to file (OFB)
  const filePath = '/tmp/cc-export-test.ofb'
  const r1 = await api.v1.assembly.exportNode({ id: tplId, file: filePath })
  console.log('[07] file export OFB — success:', r1.result?.success, 'maxLevel:', r1.maxLevel)
  console.log('[07] content present?', r1.result?.content !== undefined && r1.result?.content !== null)
  console.log('[07] result:', JSON.stringify(r1.result))

  // Export to file (STP) — format inferred from extension
  const filePathStp = '/tmp/cc-export-test.stp'
  const r2 = await api.v1.assembly.exportNode({ id: tplId, file: filePathStp })
  console.log('[07] file export STP (inferred) — success:', r2.result?.success, 'maxLevel:', r2.maxLevel)
  console.log('[07] content present?', r2.result?.content !== undefined && r2.result?.content !== null)

  // Export to file with explicit format
  const filePathStp2 = '/tmp/cc-export-test2.step'
  const r3 = await api.v1.assembly.exportNode({ id: tplId, file: filePathStp2, format: 'STP' })
  console.log('[07] file export STP (explicit) — success:', r3.result?.success, 'maxLevel:', r3.maxLevel)

  filewrite({
    ofbFile: { success: r1.result?.success, hasContent: r1.result?.content != null, maxLevel: r1.maxLevel },
    stpInferred: { success: r2.result?.success, hasContent: r2.result?.content != null, maxLevel: r2.maxLevel },
    stpExplicit: { success: r3.result?.success, hasContent: r3.result?.content != null, maxLevel: r3.maxLevel },
  }, 'file-export-results')

  return { asmId, tplId }
}
