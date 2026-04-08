// 09 — inspect negative and zero radius circles
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegRadius' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Zero radius circle
  const c0 = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 0 })).result
  // Negative radius circle
  const cNeg = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 0, 0], radius: -10 })).result
  // Normal circle for comparison
  const cPos = (await api.v1.sketch.circle({ id: skId, centerPos: [60, 0, 0], radius: 10 })).result

  console.log('[09] zero:', c0, 'neg:', cNeg, 'pos:', cPos)

  // Check radius member in structure for each
  const r = await api.v1.sketch.circle({ id: skId, centerPos: [90, 0, 0], radius: 5 }) // dummy to get fresh structure
  const tree = r.structure?.tree
  if (tree) {
    for (const [label, id] of [['zero', c0], ['neg', cNeg], ['pos', cPos]]) {
      const node = tree[String(id)]
      console.log('[09]', label, 'radius member:', node?.members?.radius?.value)
    }
  }

  await snapshot('radius-variants')
  return { partId }
}
