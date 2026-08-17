// Does the loaded model need recalc? Compare graphic data before/after recalc.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RecalcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const saved = await api.v1.common.save({
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })

  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })

  // Capture graphic data immediately after load (before recalc)
  const graphicBefore = loadR.graphic
  const structBefore = loadR.structure
  console.log('[10] After load — graphic null?', graphicBefore === null)
  console.log('[10] After load — structure null?', structBefore === null)
  if (graphicBefore) {
    const vertsBefore = graphicBefore.meshes?.reduce((s, m) => s + (m.vertices?.length || 0), 0) || 0
    console.log('[10] After load — total vertices:', vertsBefore)
  }

  await snapshot('before-recalc')

  // Recalc
  const recalcR = await api.v1.common.recalc({})
  console.log('[10] Recalc result:', recalcR.result, 'maxLevel:', recalcR.maxLevel)

  // Capture graphic data after recalc
  const graphicAfter = recalcR.graphic
  console.log('[10] After recalc — graphic null?', graphicAfter === null)
  if (graphicAfter) {
    const vertsAfter = graphicAfter.meshes?.reduce((s, m) => s + (m.vertices?.length || 0), 0) || 0
    console.log('[10] After recalc — total vertices:', vertsAfter)
  }

  await snapshot('after-recalc')

  filewrite({
    beforeRecalc: { hasGraphic: !!graphicBefore, hasStructure: !!structBefore },
    afterRecalc: { hasGraphic: !!graphicAfter, result: recalcR.result, maxLevel: recalcR.maxLevel },
  }, 'recalc-comparison')

  return { loadedId: loadR.result?.id }
}
