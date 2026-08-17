// 12 — What does doCurveTessellation do?
// Docs: "flag defines if analytic curves (e.g. arc) are tesselated on server (=true) or on client (=false)"
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CurveTessTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // With doCurveTessellation=true (default) — create a cylinder (has curved edges)
  const db1 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[12] doCurveTessellation:', db1.doCurveTessellation)

  const cylR1 = await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 30 })
  const gfx1 = cylR1.graphic
  const edgeCount1 = gfx1 ? (gfx1.edges ? gfx1.edges.length : 'no-edges-key') : 'no-graphic'
  console.log('[12] With curve tess ON: graphic keys:', gfx1 ? Object.keys(gfx1).join(',') : 'null')

  // Disable curve tessellation
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: false })
  const db2 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[12] After disable: doCurveTessellation:', db2.doCurveTessellation)

  // Create another cylinder
  const cylR2 = await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 30, translation: [50, 0, 0] })
  const gfx2 = cylR2.graphic
  const edgeCount2 = gfx2 ? (gfx2.edges ? gfx2.edges.length : 'no-edges-key') : 'no-graphic'
  console.log('[12] With curve tess OFF: graphic keys:', gfx2 ? Object.keys(gfx2).join(',') : 'null')

  // Compare edge data size if available
  if (gfx1 && gfx2) {
    filewrite(gfx1, 'graphic-curvetess-on')
    filewrite(gfx2, 'graphic-curvetess-off')
  }

  // Restore
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: true })

  return { edgeCount1, edgeCount2 }
}
