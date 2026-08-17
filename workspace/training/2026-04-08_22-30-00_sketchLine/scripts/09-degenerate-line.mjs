// 09 — edge case: degenerate line (start == end), zero-length line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DegTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Degenerate line: startPos == endPos
  const r1 = await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [10, 10, 0] })
  console.log('[09] degenerate result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[09] degenerate messages:', JSON.stringify(r1.messages))

  // Very short line (near-zero length)
  const r2 = await api.v1.sketch.line({ id: skId, startPos: [20, 20, 0], endPos: [20.001, 20, 0] })
  console.log('[09] micro line result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Non-zero Z coordinate
  const r3 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 5] })
  console.log('[09] non-zero Z result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[09] non-zero Z messages:', JSON.stringify(r3.messages))

  filewrite({
    degenerate: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    micro: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    nonZeroZ: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'edge-cases')

  await snapshot('edge-cases')
  return { partId, skId }
}
