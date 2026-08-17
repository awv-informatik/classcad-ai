/**
 * 00-discover.mjs — confirm `frame.structure` shape across mutations.
 *
 * Hypothesis: server returns a full tree snapshot on every Result frame.
 * Format: { root, currentProduct, currentInstance, testRoot, tree: { <id>: {...} } }.
 */

export default async function (api, { filewrite }) {
  // Step 0: empty
  const r0 = await api.v1.common.getAppVersion({})
  filewrite(r0.structure, '00-empty')
  const treeSize0 = Object.keys(r0.structure?.tree || {}).length
  console.log(`[00] empty — tree nodes: ${treeSize0}`)

  // Step 1: create part
  const r1 = await api.v1.part.create({ name: 'P1' })
  filewrite(r1.structure, '01-after-part-create')
  const treeSize1 = Object.keys(r1.structure?.tree || {}).length
  const partId = r1.result
  console.log(`[01] partId=${partId} — tree nodes: ${treeSize1}`)

  // Step 2: add box (correct params: length/width/height, not x/y/z)
  const r2 = await api.v1.part.box({ id: partId, name: 'Box1', length: 100, width: 100, height: 50 })
  filewrite(r2.structure, '02-after-box')
  const treeSize2 = Object.keys(r2.structure?.tree || {}).length
  console.log(`[02] boxId=${r2.result} — tree nodes: ${treeSize2}`)
  const boxId = r2.result

  // Step 3: update box (parameter change — topology unchanged)
  const r3 = await api.v1.part.updateBox({ id: boxId, length: 200 })
  filewrite(r3.structure, '03-after-update')
  const treeSize3 = Object.keys(r3.structure?.tree || {}).length
  console.log(`[03] update maxLevel=${r3.maxLevel} — tree nodes: ${treeSize3}`)

  // Step 4: add cylinder (topology change)
  const r4 = await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 20, length: 60 })
  filewrite(r4.structure, '04-after-cylinder')
  const treeSize4 = Object.keys(r4.structure?.tree || {}).length
  console.log(`[04] cylId=${r4.result} — tree nodes: ${treeSize4}`)
  const cylId = r4.result

  // Step 5: delete one feature
  const r5 = await api.v1.part.deleteFeature({ ids: [cylId] })
  filewrite(r5.structure, '05-after-delete')
  const treeSize5 = Object.keys(r5.structure?.tree || {}).length
  console.log(`[05] delete maxLevel=${r5.maxLevel} — tree nodes: ${treeSize5}`)

  // Step 6: clear everything
  const r6 = await api.v1.common.clear({})
  filewrite(r6.structure, '06-after-clear')
  const treeSize6 = Object.keys(r6.structure?.tree || {}).length
  console.log(`[06] clear — tree nodes: ${treeSize6}`)

  // Step 7: a non-mutating call AFTER mutations — does structure still come back?
  const r7 = await api.v1.common.getAppVersion({})
  filewrite(r7.structure, '07-non-mutating')
  const treeSize7 = Object.keys(r7.structure?.tree || {}).length
  console.log(`[07] non-mutating — tree nodes: ${treeSize7}`)

  return { ok: true }
}
