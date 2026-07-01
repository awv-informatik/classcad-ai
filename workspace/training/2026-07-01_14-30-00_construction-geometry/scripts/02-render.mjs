// 02 — RENDERER verification + "what construction looks like". Normal square profile (solid) + construction
// diagonal / center-axis / bolt-circle (should render dashed violet). Confirms the render-direct.mjs change.
import { makeSketch, line } from './_setup.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api, { name: 'ConstructionRender' })
  const S = api.v1.sketch
  // normal square profile (solid)
  const sq = [[0, 0], [60, 0], [60, 60], [0, 60]]
  for (let i = 0; i < 4; i++) await line(api, skId, [...sq[i], 0], [...sq[(i + 1) % 4], 0])
  // construction: diagonal, horizontal center axis, and a bolt-circle
  await S.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 60, 0], isConstruction: true })
  await S.line({ id: skId, startPos: [-12, 30, 0], endPos: [72, 30, 0], isConstruction: true })
  await S.circle({ id: skId, centerPos: [30, 30, 0], radius: 22, isConstruction: true })
  await S.arcByCenter({ id: skId, centerPos: [30, 30, 0], startPos: [30, -2, 0], endPos: [62, 30, 0], isClockwise: false, isConstruction: true })

  await snapshot('02-mixed')
  const geo = (await S.getGeometry({ id: skId })).result
  const gs = (await S.getGlobalState({ id: skId })).result
  filewrite({ counts: { lines: geo.lines.length, circles: (geo.circles || []).length, arcs: (geo.arcs || []).length }, constructionCount: gs.constructionCount }, '02-render')
  console.log('[02] lines', geo.lines.length, 'circles', (geo.circles || []).length, 'arcs', (geo.arcs || []).length, '| constructionCount', gs.constructionCount)
  return { ok: true }
}
