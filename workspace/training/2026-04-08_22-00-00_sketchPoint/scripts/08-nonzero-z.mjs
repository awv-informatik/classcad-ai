// Test: non-zero Z coordinate in an XY-plane sketch
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Try creating a point with Z=50 in an XY sketch
  const r1 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 50] })
  console.log('[08] point at (30,20,50) — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[08] messages:', JSON.stringify(r1.messages))

  // Verify the stored position — does it project to Z=0 or keep Z=50?
  if (r1.result && r1.result !== 'VOID') {
    const pos = await api.v1.sketch.getPositions({ id: r1.result })
    console.log('[08] actual stored pos:', JSON.stringify(pos.result))
    filewrite({ input: [30, 20, 50], stored: pos.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'z-test')
  } else {
    filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'z-test-failed')
  }

  await snapshot('point-with-z')
  return { partId, skId }
}
