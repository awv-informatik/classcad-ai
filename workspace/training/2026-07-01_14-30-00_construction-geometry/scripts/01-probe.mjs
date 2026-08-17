// 01 — map the isConstruction surface. Create normal + construction line/circle/arc, then inspect:
// getGeometry arrays, getObjectsLists.constructionGeometry, getObjectInfo.isConstruction, getGlobalState.count,
// and the STRUCTURE-TREE member (name/shape) — the renderer needs to read isConstruction from there.
import { makeSketch } from './_setup.mjs'

const treeNode = (tree, id) => tree?.[String(id)] || tree?.[id]
const nodeInfo = (tree, id) => {
  const n = treeNode(tree, id)
  return n ? { class: n.class, memberKeys: Object.keys(n.members || {}), isConstruction: n.members?.isConstruction, isReference: n.members?.isReference } : null
}

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api, { name: 'Construction' })
  const S = api.v1.sketch
  // normal + construction of each type
  const nLine = (await S.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const cLine = (await S.line({ id: skId, startPos: [0, 10, 0], endPos: [40, 10, 0], isConstruction: true })).result
  const nCirc = (await S.circle({ id: skId, centerPos: [20, -30, 0], radius: 8 })).result
  const cCirc = (await S.circle({ id: skId, centerPos: [60, -30, 0], radius: 8, isConstruction: true })).result
  const nArc = (await S.arcByCenter({ id: skId, centerPos: [0, -60, 0], startPos: [10, -60, 0], endPos: [0, -50, 0], isClockwise: false })).result
  const arcResp = await S.arcByCenter({ id: skId, centerPos: [40, -60, 0], startPos: [50, -60, 0], endPos: [40, -50, 0], isClockwise: false, isConstruction: true })
  const cArc = arcResp.result
  const tree = arcResp.structure?.tree || {}

  // 1) getGeometry — does it include construction curves in lines/circles/arcs?
  const geo = (await S.getGeometry({ id: skId })).result
  const inArr = (arr, id) => (arr || []).map(String).includes(String(id))
  const getGeometry = {
    lines: geo.lines, circles: geo.circles, arcs: geo.arcs, points: (geo.points || []).length,
    constructionKeys: Object.keys(geo).filter(k => /construct/i.test(k)),
    cLineInLines: inArr(geo.lines, cLine), cCircInCircles: inArr(geo.circles, cCirc), cArcInArcs: inArr(geo.arcs, cArc),
  }
  // 2) getObjectsLists — separate constructionGeometry list?
  const lists = (await S.getObjectsLists?.({ id: skId }))?.result || null
  // 3) getObjectInfo per object
  const info = {}
  for (const [k, id] of Object.entries({ nLine, cLine, nCirc, cCirc, nArc, cArc })) {
    const r = (await S.getObjectInfo({ id })).result
    info[k] = { type: r?.type, isConstruction: r?.isConstruction, isReference: r?.isReference }
  }
  // 4) getGlobalState
  const gs = (await S.getGlobalState({ id: skId })).result
  // 5) tree member for the renderer
  const treeNodes = {
    nLine: nodeInfo(tree, nLine), cLine: nodeInfo(tree, cLine),
    nCirc: nodeInfo(tree, nCirc), cCirc: nodeInfo(tree, cCirc),
    nArc: nodeInfo(tree, nArc), cArc: nodeInfo(tree, cArc),
  }

  const out = { ids: { nLine, cLine, nCirc, cCirc, nArc, cArc }, getGeometry, getObjectsLists: lists, getObjectInfo: info, getGlobalState: gs, treeNodes }
  filewrite(out, '01-probe')
  console.log('[01] getGeometry construction-in-arrays?', JSON.stringify({ cLineInLines: getGeometry.cLineInLines, cCircInCircles: getGeometry.cCircInCircles, cArcInArcs: getGeometry.cArcInArcs, extraKeys: getGeometry.constructionKeys }))
  console.log('[01] getObjectsLists', JSON.stringify(lists && { lines: lists.lines?.length, circles: lists.circles?.length, arcs: lists.arcs?.length, constructionGeometry: lists.constructionGeometry }))
  console.log('[01] getObjectInfo', JSON.stringify(info))
  console.log('[01] getGlobalState', JSON.stringify({ constructionCount: gs?.constructionCount, lineCount: gs?.lineCount, circleCount: gs?.circleCount, arcCount: gs?.arcCount }))
  console.log('[01] tree cLine', JSON.stringify(treeNodes.cLine), '\n[01] tree nLine', JSON.stringify(treeNodes.nLine))
  console.log('[01] tree cCirc.isConstruction', JSON.stringify(treeNodes.cCirc?.isConstruction), '| cArc.isConstruction', JSON.stringify(treeNodes.cArc?.isConstruction))
  return { ok: true }
}
