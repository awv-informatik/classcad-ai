// 08 — Degenerate cases: start==end, zero radius, invalid positions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DegenTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Case 1: start == end (full circle attempt?)
  const r1 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })
  console.log('[08] start==end result:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  // Case 2: center == start (zero-radius arc from one side)
  const r2 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [0, -50, 0],
    centerPos: [0, -50, 0],
    endPos: [40, -50, 0],
  })
  console.log('[08] center==start result:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  // Case 3: all three points the same
  const r3 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [0, -100, 0],
    centerPos: [0, -100, 0],
    endPos: [0, -100, 0],
  })
  console.log('[08] all same result:', r3.result, 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages))

  // Case 4: non-zero Z
  const r4 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 10],
    centerPos: [0, 0, 10],
    endPos: [40, 0, 10],
  })
  console.log('[08] non-zero Z result:', r4.result, 'maxLevel:', r4.maxLevel, 'msgs:', JSON.stringify(r4.messages))

  // Case 5: collinear points (start, center, end all on a line)
  const r5 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [-40, 0, 0],  // same as start — already tested, let me try truly collinear
  })
  console.log('[08] start==end again:', r5.result, 'maxLevel:', r5.maxLevel)

  filewrite({
    startEqEnd: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    centerEqStart: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    allSame: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    nonZeroZ: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'degenerate-results')

  await snapshot('degenerate')
  return { partId }
}
