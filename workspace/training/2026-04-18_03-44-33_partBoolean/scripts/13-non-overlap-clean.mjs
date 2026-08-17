export default async function (api, { snapshot, filewrite }) {
  // Non-overlapping test in a single part, no reuse of consumed features
  const partId = (await api.v1.part.create({ name: 'NonOverlapClean' })).result

  // Subtraction: non-overlapping bodies
  const box1 = (await api.v1.part.box({ id: partId, name: 'SubBase', length: 40, width: 40, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'SubTool', length: 30, width: 30, height: 30, translation: [100, 100, 0] })).result

  console.log('[13] sub — box1:', box1, 'box2:', box2)
  const r1 = await api.v1.part.boolean({
    id: partId,
    type: 'SUBTRACTION',
    target: box1,
    tools: [box2],
  })
  console.log('[13] non-overlap SUB — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'non-overlap-sub')

  // Intersection: non-overlapping bodies (fresh features — the previous were consumed)
  const box3 = (await api.v1.part.box({ id: partId, name: 'IntBase', length: 40, width: 40, height: 40 })).result
  const box4 = (await api.v1.part.box({ id: partId, name: 'IntTool', length: 30, width: 30, height: 30, translation: [100, 100, 0] })).result

  console.log('[13] int — box3:', box3, 'box4:', box4)
  const r2 = await api.v1.part.boolean({
    id: partId,
    type: 'INTERSECTION',
    target: box3,
    tools: [box4],
  })
  console.log('[13] non-overlap INT — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'non-overlap-int')

  return { partId }
}
