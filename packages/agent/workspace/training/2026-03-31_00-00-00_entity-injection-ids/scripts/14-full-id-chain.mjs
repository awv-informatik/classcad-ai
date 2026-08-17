// Q: Document the full ID chain for both solid and curve paths, and verify each level rejects wrong types
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MyEI' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'MyShape' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result

  console.log('[14] ID chain:')
  console.log('[14]   partId:', partId)
  console.log('[14]   eifId:', eifId, '(child of part)')
  console.log('[14]   shapeId:', shapeId, '(child of EI, for curves)')
  console.log('[14]   boxId:', boxId, '(child of EI, a solid)')

  // Verify: EI ID cannot go into curve.line (needs shape)
  const r1 = await api.v1.curve.line({ id: eifId, startPos: [0,0,0], endPos: [10,10,0] })
  console.log('[14] curve.line(eifId):', r1.maxLevel > 40 ? '❌ rejected' : '✓ accepted')

  // Verify: shape ID cannot go into solid.box (needs EI)
  const r2 = await api.v1.solid.box({ id: shapeId, length: 10, width: 10, height: 10 })
  console.log('[14] solid.box(shapeId):', r2.maxLevel > 40 ? '❌ rejected' : '✓ accepted')

  // Verify: part ID cannot go into solid.box (needs EI)
  const r3 = await api.v1.solid.box({ id: partId, length: 10, width: 10, height: 10 })
  console.log('[14] solid.box(partId):', r3.maxLevel > 40 ? '❌ rejected' : '✓ accepted')

  // Verify: part ID cannot go into curve.shape (needs EI)
  const r4 = await api.v1.curve.shape({ id: partId, name: 'Bad' })
  console.log('[14] curve.shape(partId):', r4.maxLevel > 40 ? '❌ rejected' : '✓ accepted')

  // Verify: solid ID cannot go into curve.line (needs shape)
  const r5 = await api.v1.curve.line({ id: boxId, startPos: [0,0,0], endPos: [10,10,0] })
  console.log('[14] curve.line(boxId):', r5.maxLevel > 40 ? '❌ rejected' : '✓ accepted')

  // Verify: EI ID into curve.shape — should work
  const r6 = await api.v1.curve.shape({ id: eifId, name: 'Good' })
  console.log('[14] curve.shape(eifId):', r6.maxLevel <= 31 ? '✓ accepted' : '❌ rejected', 'shapeId:', r6.result)

  filewrite({
    errors: {
      'curve.line(eifId)': { maxLevel: r1.maxLevel, msg: r1.messages?.[0]?.message },
      'solid.box(shapeId)': { maxLevel: r2.maxLevel, msg: r2.messages?.[0]?.message },
      'solid.box(partId)': { maxLevel: r3.maxLevel, msg: r3.messages?.[0]?.message },
      'curve.shape(partId)': { maxLevel: r4.maxLevel, msg: r4.messages?.[0]?.message },
      'curve.line(boxId)': { maxLevel: r5.maxLevel, msg: r5.messages?.[0]?.message },
    },
    successes: {
      'curve.shape(eifId)': { maxLevel: r6.maxLevel, result: r6.result },
    }
  }, 'id-type-validation')

  return { partId, eifId, shapeId, boxId }
}
