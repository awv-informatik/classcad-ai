// 03 — genFixation flag: does it auto-fix center at origin?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FixationTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle 1: center at origin, default genFixation=true
  const r1 = await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 10 })
  const c1 = r1.result
  console.log('[03] circle1 (origin, genFix=true):', c1)

  // Circle 2: center at origin, genFixation=false
  const r2 = await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 20, genFixation: false })
  const c2 = r2.result
  console.log('[03] circle2 (origin, genFix=false):', c2)

  // Circle 3: off-origin, genFixation=true
  const r3 = await api.v1.sketch.circle({ id: skId, centerPos: [50, 50, 0], radius: 10 })
  const c3 = r3.result
  console.log('[03] circle3 (off-origin, genFix=true):', c3)

  // Check constraints in structure
  const tree = r3.structure?.tree
  if (tree) {
    const sk = tree[String(skId)]
    const allChildren = sk?.children || []
    console.log('[03] sketch children:', allChildren.join(', '))
    for (const cid of allChildren) {
      const node = tree[String(cid)]
      if (node?.class?.includes('Constraint')) {
        console.log('[03] constraint:', node.id, node.class, node.name)
      }
    }
  }

  await snapshot('fixation-test')
  return { partId }
}
