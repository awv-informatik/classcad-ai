/**
 * 06-multi-step.mjs — build a 5-step part and assert tree state at every step.
 *
 * Steps: create part → box → cylinder → delete cylinder → another box.
 */

export default async function (api, { tree, filewrite }) {
  const log = []

  // 1: create part
  const r1 = await api.v1.part.create({ name: 'Multi' })
  const partId = r1.result
  let t = await tree()
  log.push({ step: 1, label: 'after part.create', nodes: Object.keys(t.tree).length, partId })

  // 2: add box
  const r2 = await api.v1.part.box({ id: partId, name: 'A', length: 80, width: 60, height: 40 })
  const boxAId = r2.result
  t = await tree()
  log.push({ step: 2, label: 'after box A', nodes: Object.keys(t.tree).length, boxAId })

  // 3: add cylinder
  const r3 = await api.v1.part.cylinder({ id: partId, name: 'Cyl', radius: 15, length: 50 })
  const cylId = r3.result
  t = await tree()
  log.push({ step: 3, label: 'after cyl', nodes: Object.keys(t.tree).length, cylId })

  // 4: delete cylinder
  await api.v1.part.deleteFeature({ ids: [cylId] })
  t = await tree()
  const cylGone = !t.tree[String(cylId)]
  log.push({ step: 4, label: 'after delete cyl', nodes: Object.keys(t.tree).length, cylGone })

  // 5: add second box
  const r5 = await api.v1.part.box({ id: partId, name: 'B', length: 50, width: 50, height: 50 })
  const boxBId = r5.result
  t = await tree()
  log.push({ step: 5, label: 'after box B', nodes: Object.keys(t.tree).length, boxBId })

  filewrite(log, 'multistep-log')
  filewrite(t, 'multistep-final-tree')

  // Assertions
  const allParts = await tree({ type: 'CC_Part' })
  const allBoxes = await tree({ type: 'CC_Box' })
  console.log(`[06] log:`, JSON.stringify(log))
  console.log(`[06] final CC_Part count: ${allParts.length} (expect 1)`)
  console.log(`[06] final CC_Box count: ${allBoxes.length} (expect 2)`)
  console.log(`[06] cyl gone: ${cylGone ? '✓' : '❌'}`)

  // Topology grew/shrank in expected directions
  const ok = log[1].nodes > log[0].nodes && log[2].nodes > log[1].nodes
    && log[3].nodes < log[2].nodes && log[4].nodes > log[3].nodes
  console.log(`[06] topology trajectory: ${ok ? '✓' : '❌'}`)
}
