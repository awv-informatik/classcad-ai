// Test: can common.save produce JSON format? And can exportNode produce JSON/ECXML?
// If so, that tells us the exact schema assembly.from expects.
export default async function (api, { snapshot, filewrite }) {
  console.log('[05] Creating an assembly and trying various export formats...')

  // Build a simple assembly
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({
    id: tplId, name: 'WCS1',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[05] Assembly built:', asmId, 'tpl:', tplId, 'inst1:', inst1, 'inst2:', inst2)

  // Try common.save with JSON
  try {
    const r1 = await api.v1.common.save({ format: 'JSON' })
    console.log('[05] common.save JSON:', 'maxLevel:', r1.maxLevel, 'content length:', r1.result?.content?.length)
    if (r1.result?.content) {
      filewrite(r1.result.content, 'save-json')
    }
    filewrite({ result: { contentLength: r1.result?.content?.length, success: r1.result?.success }, messages: r1.messages, maxLevel: r1.maxLevel }, 'save-json-meta')
  } catch (e) {
    console.log('[05] common.save JSON error:', e.message)
  }

  // Try exportNode in ECXML format
  try {
    const r2 = await api.v1.assembly.exportNode({ id: asmId, format: 'ECXML' })
    console.log('[05] exportNode ECXML:', 'maxLevel:', r2.maxLevel, 'success:', r2.result?.success)
    if (r2.result?.content) {
      filewrite(r2.result.content, 'export-ecxml')
    }
    filewrite({ result: { success: r2.result?.success, contentLength: r2.result?.content?.length }, messages: r2.messages, maxLevel: r2.maxLevel }, 'export-ecxml-meta')
  } catch (e) {
    console.log('[05] exportNode ECXML error:', e.message)
  }

  // Try exportNode in JSON format
  try {
    const r3 = await api.v1.assembly.exportNode({ id: asmId, format: 'JSON' })
    console.log('[05] exportNode JSON:', 'maxLevel:', r3.maxLevel, 'success:', r3.result?.success)
    if (r3.result?.content) {
      filewrite(r3.result.content, 'export-json')
    }
    filewrite({ result: { success: r3.result?.success, contentLength: r3.result?.content?.length }, messages: r3.messages, maxLevel: r3.maxLevel }, 'export-json-meta')
  } catch (e) {
    console.log('[05] exportNode JSON error:', e.message)
  }

  // Try common.save with ECXML
  try {
    const r4 = await api.v1.common.save({ format: 'ECXML' })
    console.log('[05] common.save ECXML:', 'maxLevel:', r4.maxLevel)
    if (r4.result?.content) {
      filewrite(r4.result.content, 'save-ecxml')
    }
    filewrite({ result: { contentLength: r4.result?.content?.length }, messages: r4.messages, maxLevel: r4.maxLevel }, 'save-ecxml-meta')
  } catch (e) {
    console.log('[05] common.save ECXML error:', e.message)
  }

  return { asmId, tplId, inst1, inst2 }
}
