// Compare graphic data before and after recalc — does recalc regenerate mesh data?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GraphicCompare' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

  // Read graphic data before recalc
  const before = await api.v1.common.getAppVersion({})
  const graphicBefore = before.graphic
  const vertCountBefore = graphicBefore ? JSON.stringify(graphicBefore).length : 0
  console.log('[08] graphic data size before recalc:', vertCountBefore)

  // Recalc
  const recalcR = await api.v1.common.recalc()

  // Read graphic data after recalc
  const after = await api.v1.common.getAppVersion({})
  const graphicAfter = after.graphic
  const vertCountAfter = graphicAfter ? JSON.stringify(graphicAfter).length : 0
  console.log('[08] graphic data size after recalc:', vertCountAfter)

  // Check if graphic data is present in envelope at all
  console.log('[08] has graphic before:', !!graphicBefore)
  console.log('[08] has graphic after:', !!graphicAfter)

  // Try using the recalc envelope itself
  console.log('[08] recalc has structure:', !!recalcR.structure)
  console.log('[08] recalc has graphic:', !!recalcR.graphic)

  filewrite({
    graphicSizeBefore: vertCountBefore,
    graphicSizeAfter: vertCountAfter,
    hasGraphicBefore: !!graphicBefore,
    hasGraphicAfter: !!graphicAfter,
    recalcHasStructure: !!recalcR.structure,
    recalcHasGraphic: !!recalcR.graphic,
    recalcStructureKeys: recalcR.structure ? Object.keys(recalcR.structure) : null,
  }, 'graphic-compare')

  return { graphicSizeBefore: vertCountBefore, graphicSizeAfter: vertCountAfter }
}
