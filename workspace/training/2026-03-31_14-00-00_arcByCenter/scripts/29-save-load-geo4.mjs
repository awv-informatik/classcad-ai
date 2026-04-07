// 29 — Save with geometry mode 4 (geometry + graphics) and reload
export default async function (api, { snapshot, filewrite }) {
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: true })

  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [50, 15, 0], startPos: [50, 0, 0], endPos: [65, 15, 0], isClockwise: false,
  })
  await api.v1.curve.line({ id: shapeId, startPos: [65, 15, 0], endPos: [65, 40, 0] })

  // Save with geometry mode 4 (geometry + graphics)
  const saveR = await api.v1.common.save({ format: 'OFB', encoding: 'base64', ofb: { geometry: 4 } })
  console.log('[29] save success:', saveR.result?.success)

  // Load with doClear
  const loadR = await api.v1.common.load({
    data: saveR.result.content, encoding: 'base64', format: 'OFB', doClear: true,
  })
  console.log('[29] load graphic?:', loadR.graphic != null)
  if (loadR.graphic?.containers) {
    for (const c of loadR.graphic.containers) {
      console.log(`  type=${c.type} edges=${c.edges?.length || 0}`)
      if (c.type === 2 && c.edges) {
        for (const e of c.edges) console.log(`    edge verts=${(e.points?.length || 0)/3}`)
      }
    }
    filewrite(loadR.graphic, 'load-graphic')
  }

  // Recalc after load
  const recR = await api.v1.common.recalc({})
  console.log('[29] recalc graphic?:', recR.graphic != null)
  if (recR.graphic?.containers) {
    for (const c of recR.graphic.containers) {
      console.log(`  recalc type=${c.type} edges=${c.edges?.length || 0}`)
      if (c.type === 2 && c.edges) {
        for (const e of c.edges) console.log(`    edge verts=${(e.points?.length || 0)/3}`)
      }
    }
    filewrite(recR.graphic, 'recalc-graphic')
  }

  await snapshot('after-reload')
  return {}
}
