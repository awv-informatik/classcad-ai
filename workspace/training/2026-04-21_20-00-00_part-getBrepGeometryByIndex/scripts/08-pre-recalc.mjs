export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Pre-recalc: try to get brep elements
  const preR = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 0 })
  console.log(`[08] pre-recalc lineIndex=0: result=${preR.result}, maxLevel=${preR.maxLevel}`)

  const preF = await api.v1.part.getBrepGeometryByIndex({ id: boxId, faceIndex: 0 })
  console.log(`[08] pre-recalc faceIndex=0: result=${preF.result}, maxLevel=${preF.maxLevel}`)

  // Now recalc
  await api.v1.common.recalc({})

  const postR = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 0 })
  console.log(`[08] post-recalc lineIndex=0: result=${postR.result}, maxLevel=${postR.maxLevel}`)

  const postF = await api.v1.part.getBrepGeometryByIndex({ id: boxId, faceIndex: 0 })
  console.log(`[08] post-recalc faceIndex=0: result=${postF.result}, maxLevel=${postF.maxLevel}`)

  console.log(`[08] pre vs post line IDs: ${preR.result} → ${postR.result} (same index 0)`)
  console.log(`[08] pre vs post face IDs: ${preF.result} → ${postF.result} (same index 0)`)

  filewrite({
    preRecalc: { line0: preR.result, face0: preF.result },
    postRecalc: { line0: postR.result, face0: postF.result },
    idsChanged: { line: preR.result !== postR.result, face: preF.result !== postF.result }
  }, 'pre-post-recalc')
  return { partId }
}
