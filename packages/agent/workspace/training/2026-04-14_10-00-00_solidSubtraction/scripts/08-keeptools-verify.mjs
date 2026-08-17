// Re-verify keepTools: true with proper tool validation (use translate instead of copy)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SubKeep2' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  const cyl = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 30,
    translation: [50, 40, -10]
  })).result

  console.log('[08] target:', box, 'tool:', cyl)

  // keepTools: false (default)
  const rFalse = await api.v1.solid.subtraction({ id: eifId, target: box, tools: [cyl], keepTools: false })
  console.log('[08] keepTools:false — result:', rFalse.result, 'maxLevel:', rFalse.maxLevel)

  // Try to translate consumed tool
  const tr1 = await api.v1.solid.translation({ id: eifId, solid: cyl, direction: [10, 0, 0] })
  console.log('[08] translate consumed tool — result:', tr1.result, 'maxLevel:', tr1.maxLevel, 'messages:', JSON.stringify(tr1.messages))

  await snapshot('keeptools-false')

  // Now test keepTools: true in a fresh scene
  const partId2 = (await api.v1.part.create({ name: 'SubKeep2b' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2 })).result

  const box2 = (await api.v1.solid.box({
    id: eifId2, length: 100, width: 80, height: 60
  })).result

  const cyl2 = (await api.v1.solid.cylinder({
    id: eifId2, height: 80, diameter: 30,
    translation: [50, 40, -10]
  })).result

  const rTrue = await api.v1.solid.subtraction({ id: eifId2, target: box2, tools: [cyl2], keepTools: true })
  console.log('[08] keepTools:true — result:', rTrue.result, 'maxLevel:', rTrue.maxLevel)

  // Try to translate the kept tool
  const tr2 = await api.v1.solid.translation({ id: eifId2, solid: cyl2, direction: [10, 0, 0] })
  console.log('[08] translate kept tool — result:', tr2.result, 'maxLevel:', tr2.maxLevel, 'messages:', JSON.stringify(tr2.messages))

  await snapshot('keeptools-true')

  filewrite({
    keepToolsFalse: { result: rFalse.result, toolTranslateLevel: tr1.maxLevel },
    keepToolsTrue: { result: rTrue.result, toolTranslateLevel: tr2.maxLevel }
  }, 'keeptools-comparison')

  return { partId: partId2 }
}
