export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OrderTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Query edges in a specific order, then reverse the order
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },   // bottom-front
      { pos: [80, 30, 0] },  // right-bottom
      { pos: [0, 0, 20] },   // vertical front-left
    ],
  })

  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },   // vertical front-left (was 3rd)
      { pos: [80, 30, 0] },  // right-bottom (was 2nd)
      { pos: [40, 0, 0] },   // bottom-front (was 1st)
    ],
  })

  console.log('[16] order A:', JSON.stringify(r1.result.lines))
  console.log('[16] order B:', JSON.stringify(r2.result.lines))
  console.log('[16] A reversed matches B?',
    JSON.stringify(r1.result.lines.slice().reverse()) === JSON.stringify(r2.result.lines))

  // Test: if one lookup fails in a batch, does it affect others?
  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },     // valid
      { pos: [500, 500, 500] }, // invalid
      { pos: [0, 0, 20] },     // valid
    ],
  })
  console.log('[16] mixed valid/invalid:', JSON.stringify(r3.result.lines), 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[16] messages:', JSON.stringify(r3.messages))

  filewrite({ orderA: r1.result, orderB: r2.result, mixedResult: r3 }, 'order-results')

  return { partId }
}
