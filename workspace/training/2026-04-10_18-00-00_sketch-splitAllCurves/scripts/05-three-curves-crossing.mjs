// 05 — Three curves crossing at the same point. How many segments?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitTriple' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Three lines crossing at origin
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, -50, 0], endPos: [0, 50, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [-40, -40, 0], endPos: [40, 40, 0] })).result
  console.log('[05] l1:', l1, 'l2:', l2, 'l3:', l3)

  await snapshot('before')

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[05] result:', JSON.stringify(r.result))
  console.log('[05] maxLevel:', r.maxLevel)
  console.log('[05] result length:', r.result?.length)

  filewrite({ result: r.result, maxLevel: r.maxLevel, lines: { l1, l2, l3 } }, 'triple-response')

  // Check segment names
  const tree = r.structure?.tree
  if (tree) {
    for (const id of r.result) {
      const node = tree[String(id)]
      if (node) console.log('[05] segment', id, ':', node.class, node.name)
    }
  }

  await snapshot('after')
  return { partId }
}
