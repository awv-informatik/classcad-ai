export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletSeq2' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  // First fillet: top-front edge
  const edges1 = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines

  const r1 = await api.v1.part.fillet({
    id: partId,
    name: 'Fillet1',
    references: edges1,
    radius: 10,
  })
  console.log('[16] fillet1 result:', r1.result, 'maxLevel:', r1.maxLevel)
  await snapshot('after-fillet1')

  // Recalc after first fillet to get fresh edge IDs
  await api.v1.common.recalc({})

  // Second fillet: bottom-right edge (z=0, x=80)
  const edges2 = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [80, 30, 0] }],
  })).result.lines
  console.log('[16] second edge IDs:', JSON.stringify(edges2))

  const r2 = await api.v1.part.fillet({
    id: partId,
    name: 'Fillet2',
    references: edges2,
    radius: 8,
  })
  console.log('[16] fillet2 result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[16] messages:', JSON.stringify(r2.messages))

  filewrite({
    fillet1: { id: r1.result, maxLevel: r1.maxLevel },
    fillet2: { id: r2.result, maxLevel: r2.maxLevel },
  }, 'sequential-results')

  await snapshot('after-fillet2')

  return { partId, fillet1: r1.result, fillet2: r2.result }
}
