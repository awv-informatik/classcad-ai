// 25 — Debug: use low-level client to toggle Configuration and force graphic resend
// This mimics what we'd do in renderSession
export default async function (api, { snapshot, filewrite }) {
  // Access underlying client via the special __client property
  // Actually, we can't — the harness doesn't expose it
  // Instead, let me test: does toggling sendGraphic_Kernel OFF then ON via
  // a manual Configuration push trigger a graphic resend?
  // We'll do this indirectly by saving to OFB and reopening

  await api.v1.common.setDatabaseSettings({ doCurveTessellation: true })

  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Create multiple curves in one shape
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [50, 15, 0], startPos: [50, 0, 0], endPos: [65, 15, 0], isClockwise: false,
  })
  await api.v1.curve.line({ id: shapeId, startPos: [65, 15, 0], endPos: [65, 40, 0] })

  // Save as OFB
  const saveR = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  const ofbContent = saveR.result?.content
  console.log('[25] save success:', saveR.result?.success, 'content length:', ofbContent?.length)

  // Clear the drawing
  await api.v1.common.clear({})

  // Reopen from OFB
  const openR = await api.v1.common.open({ content: ofbContent, encoding: 'base64' })
  console.log('[25] open maxLevel:', openR.maxLevel)
  console.log('[25] open graphic?:', openR.graphic != null)

  if (openR.graphic?.containers) {
    for (let i = 0; i < openR.graphic.containers.length; i++) {
      const c = openR.graphic.containers[i]
      console.log(`[25] container[${i}] type=${c.type} edges=${c.edges?.length || 0}`)
      if (c.type === 2 && c.edges) {
        for (const e of c.edges) {
          const nV = (e.points?.length || 0) / 3
          console.log(`  edge verts=${nV}`)
          if (e.points?.length >= 6) {
            console.log(`    first: (${e.points[0].toFixed(1)},${e.points[1].toFixed(1)})`)
            const L = e.points.length
            console.log(`    last: (${e.points[L-3].toFixed(1)},${e.points[L-2].toFixed(1)})`)
          }
        }
      }
    }
    filewrite(openR.graphic, 'after-reopen-graphic')
  }

  // Also try recalc after reopen
  const recalcR = await api.v1.common.recalc({})
  console.log('[25] recalc graphic?:', recalcR.graphic != null)
  if (recalcR.graphic?.containers) {
    for (let i = 0; i < recalcR.graphic.containers.length; i++) {
      const c = recalcR.graphic.containers[i]
      console.log(`[25] recalc container[${i}] type=${c.type} edges=${c.edges?.length || 0}`)
      if (c.type === 2 && c.edges) {
        for (const e of c.edges) console.log(`  edge verts=${(e.points?.length || 0)/3}`)
      }
    }
    filewrite(recalcR.graphic, 'after-recalc-graphic')
  }

  await snapshot('after-reopen')
  return {}
}
