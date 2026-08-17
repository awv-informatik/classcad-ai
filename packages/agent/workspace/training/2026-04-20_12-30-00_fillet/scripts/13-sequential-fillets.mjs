export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletSequential' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  // First fillet: top-front edge, radius=10
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
  console.log('[13] fillet1 result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('after-fillet1')

  // Edge IDs change after fillet — need fresh ones
  await api.v1.common.recalc({})
  const edges2 = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 30, 20] }],  // left-vertical edge
  })).result.lines
  console.log('[13] second edge IDs:', JSON.stringify(edges2))

  const r2 = await api.v1.part.fillet({
    id: partId,
    name: 'Fillet2',
    references: edges2,
    radius: 8,
  })
  console.log('[13] fillet2 result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[13] messages:', JSON.stringify(r2.messages))

  filewrite({
    fillet1: { id: r1.result, maxLevel: r1.maxLevel },
    fillet2: { id: r2.result, maxLevel: r2.maxLevel },
  }, 'sequential-results')

  await snapshot('after-fillet2')

  return { partId, fillet1: r1.result, fillet2: r2.result }
}
