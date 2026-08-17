// Edge case: zero-radius circle, duplicate points, degenerate line
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Test 1: zero-radius circle
  console.log('[15] Testing zero-radius circle...')
  try {
    const r1 = await api.v1.sketch.geometry({
      id: skId,
      circles: [{ centerPos: [0, 0, 0], radius: 0 }],
    })
    console.log('[15a] zero-radius result:', JSON.stringify(r1.result))
    console.log('[15a] maxLevel:', r1.maxLevel)
    console.log('[15a] messages:', JSON.stringify(r1.messages))
    filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'zero-radius')
  } catch (e) {
    console.log('[15a] zero-radius ERROR:', e.message)
    filewrite({ error: e.message }, 'zero-radius')
  }

  // Test 2: degenerate line (start == end)
  console.log('[15] Testing degenerate line...')
  try {
    const r2 = await api.v1.sketch.geometry({
      id: skId,
      lines: [{ startPos: [10, 10, 0], endPos: [10, 10, 0] }],
    })
    console.log('[15b] degenerate line result:', JSON.stringify(r2.result))
    console.log('[15b] maxLevel:', r2.maxLevel)
    console.log('[15b] messages:', JSON.stringify(r2.messages))
    filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'degenerate-line')
  } catch (e) {
    console.log('[15b] degenerate line ERROR:', e.message)
    filewrite({ error: e.message }, 'degenerate-line')
  }

  // Test 3: negative radius circle
  console.log('[15] Testing negative-radius circle...')
  try {
    const r3 = await api.v1.sketch.geometry({
      id: skId,
      circles: [{ centerPos: [30, 0, 0], radius: -10 }],
    })
    console.log('[15c] neg-radius result:', JSON.stringify(r3.result))
    console.log('[15c] maxLevel:', r3.maxLevel)
    filewrite({ result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }, 'neg-radius')
  } catch (e) {
    console.log('[15c] neg-radius ERROR:', e.message)
    filewrite({ error: e.message }, 'neg-radius')
  }

  return { partId }
}
