// 26 — Debug: save, clear, load to force full graphic regeneration
export default async function (api, { snapshot, filewrite }) {
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
  console.log('[26] save success:', saveR.result?.success)

  // Clear and reload
  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({
    data: saveR.result.content,
    encoding: 'base64',
    format: 'OFB',
    doClear: true,
  })
  console.log('[26] load maxLevel:', loadR.maxLevel)
  console.log('[26] load graphic?:', loadR.graphic != null)

  if (loadR.graphic?.containers) {
    for (let i = 0; i < loadR.graphic.containers.length; i++) {
      const c = loadR.graphic.containers[i]
      console.log(`[26] container[${i}] type=${c.type} edges=${c.edges?.length || 0}`)
      if (c.type === 2 && c.edges) {
        for (const e of c.edges) {
          const nV = (e.points?.length || 0) / 3
          const first = e.points ? `(${e.points[0].toFixed(1)},${e.points[1].toFixed(1)})` : '?'
          const L = e.points?.length || 0
          const last = L >= 3 ? `(${e.points[L-3].toFixed(1)},${e.points[L-2].toFixed(1)})` : '?'
          console.log(`  edge verts=${nV} ${first} -> ${last}`)
        }
      }
    }
    filewrite(loadR.graphic, 'after-load-graphic')
  }

  // Recalc after load
  const recalcR = await api.v1.common.recalc({})
  console.log('[26] recalc graphic?:', recalcR.graphic != null)
  if (recalcR.graphic?.containers) {
    for (let i = 0; i < recalcR.graphic.containers.length; i++) {
      const c = recalcR.graphic.containers[i]
      console.log(`[26] recalc container[${i}] type=${c.type} edges=${c.edges?.length || 0}`)
      if (c.type === 2 && c.edges) {
        for (const e of c.edges) console.log(`  edge verts=${(e.points?.length || 0)/3}`)
      }
    }
    filewrite(recalcR.graphic, 'after-recalc-graphic')
  }

  await snapshot('after-reload')
  return {}
}
