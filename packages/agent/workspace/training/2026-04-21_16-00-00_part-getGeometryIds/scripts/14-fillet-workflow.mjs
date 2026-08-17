export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletWF' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Find a vertical edge for filleting: front-left at [0, 0, 20]
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
  })
  console.log('[14] vertical edge:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  const edgeId = r1.result.lines[0]

  // Fillet using the found edge ID
  const filletId = (await api.v1.part.fillet({
    id: partId,
    name: 'Fillet1',
    references: [edgeId],
    radius: 8,
  })).result
  console.log('[14] fillet result:', filletId)

  await api.v1.common.recalc({})

  // After fillet, brep topology changed. Find new edges.
  // The fillet creates a curved face replacing the straight edge.
  // The fillet face has arc edges at top and bottom.
  // Top arc of fillet at ~[0, 0, 40] area
  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }],  // bottom-front edge (should still exist)
  })
  console.log('[14] post-fillet bottom-front edge:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Find the fillet arcs
  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    arcs: [{ pos: [0, 0, 40] }],  // top of where fillet meets the top face
  })
  console.log('[14] fillet top arc:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  // Find multiple edges for a second fillet
  const r4 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [80, 0, 20] },  // front-right vertical edge
      { pos: [0, 60, 20] },  // back-left vertical edge
    ],
  })
  console.log('[14] two more edges:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)

  if (r4.result.lines?.length === 2) {
    const fillet2 = (await api.v1.part.fillet({
      id: partId,
      name: 'Fillet2',
      references: r4.result.lines,
      radius: 5,
    })).result
    console.log('[14] second fillet:', fillet2)
  }

  await snapshot('fillet-workflow')
  return { partId }
}
