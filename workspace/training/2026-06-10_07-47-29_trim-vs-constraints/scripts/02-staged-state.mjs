// Q2: STAGED state (after splitAllCurves, before mergeBack) on a constrained sketch:
// are constraint/dimension nodes still present? do original curves stay queryable/live?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Staged' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result
  const ctr = async id => (await api.v1.sketch.getPoints({ id })).result.centerId

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 40, 0], radius: 20 })).result
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [70, 45, 0], radius: 18 })).result
  const p1 = await ctr(c1), p2 = await ctr(c2)
  const cons = await api.v1.sketch.constraint([{ id: skId, type: 'FIXATION', geomIds: [p1] }])
  const dims = await api.v1.sketch.dimension([
    { id: skId, type: 'DIAMETER', geomIds: [c1], value: 45 },
    { id: skId, type: 'DIAMETER', geomIds: [c2], value: 45 },
    { id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [p1, p2], value: 38 },
    { id: skId, type: 'VERTICAL_DISTANCE', geomIds: [p1, p2], value: 0 },
  ])
  console.log('[02] setup maxLevels:', cons.maxLevel, dims.maxLevel, 'dims:', JSON.stringify(dims.result))

  const countNodes = (resp) => {
    const all = Object.values(resp.structure?.tree ?? {})
    return {
      constraints: all.filter(n => /Constraint/.test(n?.class ?? '')).length,
      dims: all.filter(n => /FeatureDimension/.test(n?.class ?? '')).length,
      splitContainers: all.filter(n => ['SplittedCurves', 'NoneSplitted'].includes(n?.name)).length,
    }
  }

  const before = countNodes(dims)
  const sp = await api.v1.sketch.splitAllCurves({ id: skId })
  const after = countNodes(sp)
  console.log('[02] nodes before split:', JSON.stringify(before))
  console.log('[02] nodes after split (staged):', JSON.stringify(after), 'segments:', sp.result?.length, 'maxLevel:', sp.maxLevel)

  // originals still live?
  const pos1 = await api.v1.sketch.getPositions({ id: p1 })
  const c2pos = await api.v1.sketch.getPositions({ id: p2 })
  console.log('[02] originals queryable during staged state:', pos1.result != null && c2pos.result != null,
    '— c2 center:', JSON.stringify(c2pos.result?.pos), '(expect (78,40): solver laid out before split)')

  filewrite({ before, after, segCount: sp.result?.length }, 'staged')
  return {}
}
