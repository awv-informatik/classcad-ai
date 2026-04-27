export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // No properties — just target, nothing to set
  const r1 = await api.v1.part.setAppearance({ target: boxId })
  console.log('[09] no-props:', r1.result, 'maxLevel:', r1.maxLevel)

  // Color only (no transparency)
  const r2 = await api.v1.part.setAppearance({ target: boxId, color: [255, 0, 0] })
  console.log('[09] color-only:', r2.maxLevel)

  // Transparency only (no color)
  const r3 = await api.v1.part.setAppearance({ target: boxId, transparency: 0.5 })
  console.log('[09] transparency-only:', r3.maxLevel)

  // Out-of-range color values (negative, >255)
  const r4 = await api.v1.part.setAppearance({ target: boxId, color: [-10, 300, 128] })
  console.log('[09] out-of-range color:', r4.maxLevel)
  if (r4.messages?.length) console.log('[09] OOR color msgs:', JSON.stringify(r4.messages))

  // Out-of-range transparency (>1, <0)
  const r5 = await api.v1.part.setAppearance({ target: boxId, transparency: 1.5 })
  console.log('[09] OOR transparency>1:', r5.maxLevel)

  const r6 = await api.v1.part.setAppearance({ target: boxId, transparency: -0.5 })
  console.log('[09] OOR transparency<0:', r6.maxLevel)

  // Wrong color array size: 2 elements
  const r7 = await api.v1.part.setAppearance({ target: boxId, color: [255, 0] })
  console.log('[09] color 2 elements:', r7.maxLevel)
  if (r7.messages?.length) console.log('[09] 2-elem msgs:', JSON.stringify(r7.messages))

  // Wrong color array size: 4 elements
  const r8 = await api.v1.part.setAppearance({ target: boxId, color: [255, 0, 0, 128] })
  console.log('[09] color 4 elements:', r8.maxLevel)
  if (r8.messages?.length) console.log('[09] 4-elem msgs:', JSON.stringify(r8.messages))

  // Float color values
  const r9 = await api.v1.part.setAppearance({ target: boxId, color: [127.5, 63.25, 200.9] })
  console.log('[09] float color:', r9.maxLevel)

  // Invalid target ID (nonexistent)
  const r10 = await api.v1.part.setAppearance({ target: 99999, color: [0, 0, 0] })
  console.log('[09] invalid target:', r10.maxLevel)
  if (r10.messages?.length) console.log('[09] invalid msgs:', JSON.stringify(r10.messages))

  filewrite({
    noProps: { maxLevel: r1.maxLevel, msgs: r1.messages },
    colorOnly: { maxLevel: r2.maxLevel, msgs: r2.messages },
    transpOnly: { maxLevel: r3.maxLevel, msgs: r3.messages },
    oorColor: { maxLevel: r4.maxLevel, msgs: r4.messages },
    oorTranspHigh: { maxLevel: r5.maxLevel, msgs: r5.messages },
    oorTranspLow: { maxLevel: r6.maxLevel, msgs: r6.messages },
    color2Elem: { maxLevel: r7.maxLevel, msgs: r7.messages },
    color4Elem: { maxLevel: r8.maxLevel, msgs: r8.messages },
    floatColor: { maxLevel: r9.maxLevel, msgs: r9.messages },
    invalidId: { maxLevel: r10.maxLevel, msgs: r10.messages },
  }, 'edge-results')

  return { partId }
}
