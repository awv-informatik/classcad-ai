// Test: 2PLANES type — two face/plane refs define the axis at their intersection
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Build a box: 80x60x40
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get two perpendicular faces
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [
      { positions: [[40, 30, 40]] },  // top face (z=40)
      { positions: [[40, 0, 20]] },   // front face (y=0)
      { positions: [[0, 30, 20]] },   // left face (x=0)
    ]
  })
  const topFace = gids.result?.planes?.[0]
  const frontFace = gids.result?.planes?.[1]
  const leftFace = gids.result?.planes?.[2]
  console.log('[07] topFace:', topFace, 'frontFace:', frontFace, 'leftFace:', leftFace)

  // 2PLANES with brep faces
  if (topFace && frontFace) {
    const r1 = await api.v1.part.workAxis({
      id: partId,
      name: 'WA_2planes_brep',
      type: '2PLANES',
      references: [topFace, frontFace]
    })
    console.log('[07] 2PLANES(brep) result:', r1.result, 'maxLevel:', r1.maxLevel)
    console.log('[07] messages:', JSON.stringify(r1.messages))
    filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, '2planes-brep')
  }

  // 2PLANES with work planes (built-in)
  const topWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const frontWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
  console.log('[07] topWp:', topWp, 'frontWp:', frontWp)

  if (topWp && frontWp) {
    const r2 = await api.v1.part.workAxis({
      id: partId,
      name: 'WA_2planes_work',
      type: '2PLANES',
      references: [topWp, frontWp]
    })
    console.log('[07] 2PLANES(work) result:', r2.result, 'maxLevel:', r2.maxLevel)
    console.log('[07] messages:', JSON.stringify(r2.messages))
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, '2planes-work')
  }

  // 2PLANES with mixed: brep face + work plane
  if (leftFace && topWp) {
    const r3 = await api.v1.part.workAxis({
      id: partId,
      name: 'WA_2planes_mixed',
      type: '2PLANES',
      references: [leftFace, topWp]
    })
    console.log('[07] 2PLANES(mixed) result:', r3.result, 'maxLevel:', r3.maxLevel)
    console.log('[07] messages:', JSON.stringify(r3.messages))
    filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, '2planes-mixed')
  }

  // Edge case: parallel planes (no intersection line)
  if (topFace) {
    const topWpCustom = (await api.v1.part.workPlane({
      id: partId, name: 'WP_par', normal: [0, 0, 1], offset: 100
    })).result
    if (topWpCustom) {
      const r4 = await api.v1.part.workAxis({
        id: partId,
        name: 'WA_parallel',
        type: '2PLANES',
        references: [topFace, topWpCustom]
      })
      console.log('[07] 2PLANES(parallel) result:', r4.result, 'maxLevel:', r4.maxLevel)
      console.log('[07] messages:', JSON.stringify(r4.messages))
      filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, '2planes-parallel')
    }
  }

  await snapshot('2planes')
  return { partId }
}
