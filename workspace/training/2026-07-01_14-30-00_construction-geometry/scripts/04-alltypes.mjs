// 04 — cover the remaining creation paths: arcBy3Points + the BATCH geometry() call, each with isConstruction.
// Verify via getObjectInfo/getGlobalState and a snapshot (all construction should render dashed violet).
import { makeSketch } from './_setup.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api, { name: 'AllTypes' })
  const S = api.v1.sketch

  // arcBy3Points: normal + construction
  const nA3 = (await S.arcBy3Points({ id: skId, startPos: [0, 0, 0], midPos: [10, 8, 0], endPos: [20, 0, 0] })).result
  const cA3 = (await S.arcBy3Points({ id: skId, startPos: [0, 20, 0], midPos: [10, 28, 0], endPos: [20, 20, 0], isConstruction: true })).result

  // batch geometry() — mixed normal + construction across all sub-types
  const batch = await S.geometry({
    id: skId,
    lines: [
      { startPos: [40, 0, 0], endPos: [80, 0, 0] },
      { startPos: [40, 10, 0], endPos: [80, 10, 0], isConstruction: true },
    ],
    circles: [
      { centerPos: [60, -25, 0], radius: 8 },
      { centerPos: [90, -25, 0], radius: 8, isConstruction: true },
    ],
    arcsByCenter: [
      { centerPos: [40, 40, 0], startPos: [50, 40, 0], endPos: [40, 50, 0], isClockwise: false, isConstruction: true },
    ],
  })

  await snapshot('04-alltypes')
  const info = {}
  for (const [k, id] of Object.entries({ nA3, cA3 })) info[k] = (await S.getObjectInfo({ id })).result?.isConstruction
  const gs = (await S.getGlobalState({ id: skId })).result
  const lists = (await S.getObjectsLists({ id: skId })).result
  const out = { arcBy3Points: info, batchResult: batch?.result, constructionCount: gs.constructionCount, constructionGeometry: lists.constructionGeometry }
  filewrite(out, '04-alltypes')
  console.log('[04] arcBy3Points isConstruction', JSON.stringify(info))
  console.log('[04] batch geometry result', JSON.stringify(batch?.result))
  console.log('[04] constructionCount', gs.constructionCount, '| constructionGeometry ids', JSON.stringify(lists.constructionGeometry))
  return out
}
