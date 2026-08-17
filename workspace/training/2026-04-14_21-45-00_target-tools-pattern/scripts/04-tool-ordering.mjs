// Test: Does tool ordering matter for multi-tool boolean operations?
// Create identical setups, apply tools in [A, B] vs [B, A] order, compare vertex counts
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ToolOrderTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Setup: target box, tool A (cylinder), tool B (small box) — all overlapping
  async function makeSetup() {
    const target = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60 })).result
    const toolA = (await api.v1.solid.cylinder({ id: eifId, diameter: 30, height: 80, translation: [30, 40, -10] })).result
    const toolB = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 80, translation: [60, 40, -10] })).result
    return { target, toolA, toolB }
  }

  const results = {}

  // --- SUBTRACTION: order [A, B] ---
  const s1 = await makeSetup()
  const rSub1 = await api.v1.solid.subtraction({ id: eifId, target: s1.target, tools: [s1.toolA, s1.toolB] })
  const g1 = rSub1.graphic
  const verts1 = g1 ? Object.values(g1).reduce((sum, b) => sum + (b.position?.length || 0) / 3, 0) : 'no graphic'

  // --- SUBTRACTION: order [B, A] ---
  const s2 = await makeSetup()
  const rSub2 = await api.v1.solid.subtraction({ id: eifId, target: s2.target, tools: [s2.toolB, s2.toolA] })
  const g2 = rSub2.graphic
  const verts2 = g2 ? Object.values(g2).reduce((sum, b) => sum + (b.position?.length || 0) / 3, 0) : 'no graphic'

  results.subtraction = { vertsAB: verts1, vertsBA: verts2, same: verts1 === verts2 }
  console.log(`[04] subtraction [A,B] verts=${verts1}, [B,A] verts=${verts2}, same=${verts1 === verts2}`)

  // --- UNION: order [A, B] vs [B, A] ---
  const u1Setup = await makeSetup()
  const rU1 = await api.v1.solid.union({ id: eifId, target: u1Setup.target, tools: [u1Setup.toolA, u1Setup.toolB] })
  const gu1 = rU1.graphic
  const vertsU1 = gu1 ? Object.values(gu1).reduce((sum, b) => sum + (b.position?.length || 0) / 3, 0) : 'no graphic'

  const u2Setup = await makeSetup()
  const rU2 = await api.v1.solid.union({ id: eifId, target: u2Setup.target, tools: [u2Setup.toolB, u2Setup.toolA] })
  const gu2 = rU2.graphic
  const vertsU2 = gu2 ? Object.values(gu2).reduce((sum, b) => sum + (b.position?.length || 0) / 3, 0) : 'no graphic'

  results.union = { vertsAB: vertsU1, vertsBA: vertsU2, same: vertsU1 === vertsU2 }
  console.log(`[04] union [A,B] verts=${vertsU1}, [B,A] verts=${vertsU2}, same=${vertsU1 === vertsU2}`)

  filewrite(results, 'tool-ordering-results')
  await snapshot('ordering-test')
  return { partId }
}
