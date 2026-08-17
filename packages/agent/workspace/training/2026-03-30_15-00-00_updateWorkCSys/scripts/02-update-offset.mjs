// Test: update offset, rotation, inverted
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const csId = (await api.v1.part.workCSys({ id: partId, name: 'CS1', offset: [0, 0, 0] })).result

  // Update offset
  await api.v1.part.openFeature({ id: csId })
  const r1 = await api.v1.part.updateWorkCSys({ id: csId, offset: [50, 30, 20] })
  console.log('[02] offset result:', r1.result, 'maxLevel:', r1.maxLevel)
  await api.v1.part.closeFeature({ id: csId })

  // Update rotation
  await api.v1.part.openFeature({ id: csId })
  const r2 = await api.v1.part.updateWorkCSys({ id: csId, rotation: [0, 0, Math.PI / 4] })
  console.log('[02] rotation result:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: csId })

  // Update inverted
  await api.v1.part.openFeature({ id: csId })
  const r3 = await api.v1.part.updateWorkCSys({ id: csId, inverted: true })
  console.log('[02] inverted result:', r3.result, 'maxLevel:', r3.maxLevel)
  await api.v1.part.closeFeature({ id: csId })

  // Update multiple in one session
  await api.v1.part.openFeature({ id: csId })
  const r4 = await api.v1.part.updateWorkCSys({ id: csId, offset: [100, 0, 0] })
  const r5 = await api.v1.part.updateWorkCSys({ id: csId, rotation: [Math.PI / 2, 0, 0] })
  const r6 = await api.v1.part.updateWorkCSys({ id: csId, inverted: false })
  console.log('[02] multi:', r4.maxLevel, r5.maxLevel, r6.maxLevel)
  await api.v1.part.closeFeature({ id: csId })

  filewrite({
    offset: { result: r1.result, maxLevel: r1.maxLevel },
    rotation: { result: r2.result, maxLevel: r2.maxLevel },
    inverted: { result: r3.result, maxLevel: r3.maxLevel },
    multi: [r4.maxLevel, r5.maxLevel, r6.maxLevel]
  }, 'update-responses')
  return { partId }
}
