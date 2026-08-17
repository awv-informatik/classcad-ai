export default async function (api, { filewrite }) {
  // Create assembly with a part template that has built-in work geometry
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[01] asmId:', asmId)

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  console.log('[01] tplId:', tplId)

  // Build a box so the template has geometry
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Box1', length: 40, width: 30, height: 20 })).result
  console.log('[01] boxId:', boxId)

  // Return to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Try assembly.getWorkGeometry on the template (part template ID)
  const topRes = await api.v1.assembly.getWorkGeometry({ id: tplId, name: 'Top' })
  console.log('[01] Top on tplId:', topRes.result, 'maxLevel:', topRes.maxLevel)

  const frontRes = await api.v1.assembly.getWorkGeometry({ id: tplId, name: 'Front' })
  console.log('[01] Front on tplId:', frontRes.result, 'maxLevel:', frontRes.maxLevel)

  const rightRes = await api.v1.assembly.getWorkGeometry({ id: tplId, name: 'Right' })
  console.log('[01] Right on tplId:', rightRes.result, 'maxLevel:', rightRes.maxLevel)

  const xAxisRes = await api.v1.assembly.getWorkGeometry({ id: tplId, name: 'XAxis' })
  console.log('[01] XAxis on tplId:', xAxisRes.result, 'maxLevel:', xAxisRes.maxLevel)

  const yAxisRes = await api.v1.assembly.getWorkGeometry({ id: tplId, name: 'YAxis' })
  console.log('[01] YAxis on tplId:', yAxisRes.result, 'maxLevel:', yAxisRes.maxLevel)

  const zAxisRes = await api.v1.assembly.getWorkGeometry({ id: tplId, name: 'ZAxis' })
  console.log('[01] ZAxis on tplId:', zAxisRes.result, 'maxLevel:', zAxisRes.maxLevel)

  const originRes = await api.v1.assembly.getWorkGeometry({ id: tplId, name: 'Origin' })
  console.log('[01] Origin on tplId:', originRes.result, 'maxLevel:', originRes.maxLevel)

  filewrite({
    tplId,
    Top: { id: topRes.result, maxLevel: topRes.maxLevel, messages: topRes.messages },
    Front: { id: frontRes.result, maxLevel: frontRes.maxLevel, messages: frontRes.messages },
    Right: { id: rightRes.result, maxLevel: rightRes.maxLevel, messages: rightRes.messages },
    XAxis: { id: xAxisRes.result, maxLevel: xAxisRes.maxLevel, messages: xAxisRes.messages },
    YAxis: { id: yAxisRes.result, maxLevel: yAxisRes.maxLevel, messages: yAxisRes.messages },
    ZAxis: { id: zAxisRes.result, maxLevel: zAxisRes.maxLevel, messages: zAxisRes.messages },
    Origin: { id: originRes.result, maxLevel: originRes.maxLevel, messages: originRes.messages },
  }, 'builtin-on-template')

  // Also try part.getWorkGeometry for comparison
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  const topPart = await api.v1.part.getWorkGeometry({ id: tplId, name: 'Top' })
  console.log('[01] part.getWorkGeometry Top on tplId:', topPart.result, 'maxLevel:', topPart.maxLevel)
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  filewrite({
    partGetWorkGeometry_Top: { id: topPart.result, maxLevel: topPart.maxLevel },
    assemblyGetWorkGeometry_Top: { id: topRes.result, maxLevel: topRes.maxLevel },
    sameId: topPart.result === topRes.result,
  }, 'compare-part-vs-assembly')

  return { asmId, tplId }
}
