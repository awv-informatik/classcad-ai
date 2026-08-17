export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TargetTest' })).result

  // Part feature (box)
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Try: target = part feature ID
  const r1 = await api.v1.part.setAppearance({ target: boxId, color: [255, 0, 0] })
  console.log('[03] target=partFeature:', r1.result, 'maxLevel:', r1.maxLevel)

  // Try: target = part container ID (should fail per common.setAppearance findings)
  const r2 = await api.v1.part.setAppearance({ target: partId, color: [0, 255, 0] })
  console.log('[03] target=partId:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[03] partId messages:', JSON.stringify(r2.messages))

  // Try: entity injection feature + direct solid
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const solidId = (await api.v1.solid.box({ id: eifId, length: 30, width: 20, height: 15, translation: [80, 0, 0] })).result

  // target = entity injection feature
  const r3 = await api.v1.part.setAppearance({ target: eifId, color: [0, 0, 255] })
  console.log('[03] target=eifId:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[03] eifId messages:', JSON.stringify(r3.messages))

  // target = direct solid ID
  const r4 = await api.v1.part.setAppearance({ target: solidId, color: [255, 255, 0] })
  console.log('[03] target=solidId:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[03] solidId messages:', JSON.stringify(r4.messages))

  // target = sketch ID (should fail)
  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const r5 = await api.v1.part.setAppearance({ target: skId, color: [128, 128, 128] })
  console.log('[03] target=sketchId:', r5.result, 'maxLevel:', r5.maxLevel)
  if (r5.messages?.length) console.log('[03] sketchId messages:', JSON.stringify(r5.messages))

  // target = work plane ID (should fail)
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  const r6 = await api.v1.part.setAppearance({ target: wpId, color: [200, 200, 200] })
  console.log('[03] target=workPlane:', r6.result, 'maxLevel:', r6.maxLevel)
  if (r6.messages?.length) console.log('[03] workPlane messages:', JSON.stringify(r6.messages))

  filewrite({
    partFeature: { result: r1.result, maxLevel: r1.maxLevel, msgs: r1.messages },
    partContainer: { result: r2.result, maxLevel: r2.maxLevel, msgs: r2.messages },
    entityInjection: { result: r3.result, maxLevel: r3.maxLevel, msgs: r3.messages },
    directSolid: { result: r4.result, maxLevel: r4.maxLevel, msgs: r4.messages },
    sketch: { result: r5.result, maxLevel: r5.maxLevel, msgs: r5.messages },
    workPlane: { result: r6.result, maxLevel: r6.maxLevel, msgs: r6.messages },
  }, 'target-types')

  await snapshot('targets')
  return { partId }
}
