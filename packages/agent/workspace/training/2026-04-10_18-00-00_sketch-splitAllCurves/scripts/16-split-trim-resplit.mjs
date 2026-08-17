// 16 — Full workflow then re-split: split → trim → mergeBack → splitAllCurves again
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitResplit' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle + horizontal line
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const hLine = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  // Add a vertical line that intersects both
  const vLine = (await api.v1.sketch.line({ id: skId, startPos: [0, -60, 0], endPos: [0, 60, 0] })).result

  // First split
  const r1 = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[16] first split:', JSON.stringify(r1.result), 'count:', r1.result?.length)

  // Trim one segment (first one) then mergeBack
  if (r1.result?.length > 0) {
    const trimR = await api.v1.sketch.trimCurves({ id: skId, curveIds: [r1.result[0]] })
    console.log('[16] trim maxLevel:', trimR.maxLevel)
    const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
    console.log('[16] mergeBack maxLevel:', mergeR.maxLevel)
  }

  await snapshot('after-trim')

  // Now split again — we have fewer curves
  const r2 = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[16] second split:', JSON.stringify(r2.result), 'count:', r2.result?.length)

  const tree = r2.structure?.tree
  if (tree) {
    for (const id of r2.result) {
      const node = tree[String(id)]
      if (node) console.log('[16] segment', id, ':', node.class, node.name)
    }
  }

  filewrite({ firstSplit: r1.result, secondSplit: r2.result }, 'resplit')
  await snapshot('after-resplit')
  return { partId }
}
