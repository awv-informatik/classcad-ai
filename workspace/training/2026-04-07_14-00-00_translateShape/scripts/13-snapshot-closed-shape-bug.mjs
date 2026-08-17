// Investigate: snapshot + closed shape invalidation
// Hypothesis: closed shapes (polyline or manual close) get reorganized by snapshot
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SnapBug' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test A: 3 lines (open) + snapshot + translate
  const sA = (await api.v1.curve.shape({ id: eifId, name: 'Open3' })).result
  await api.v1.curve.line({ id: sA, startPos: [0, 0, 0], endPos: [20, 0, 0] })
  await api.v1.curve.line({ id: sA, startPos: [20, 0, 0], endPos: [20, 10, 0] })
  await api.v1.curve.line({ id: sA, startPos: [20, 10, 0], endPos: [0, 10, 0] })
  await snapshot('open3')
  const rA = await api.v1.curve.translateShape({ id: sA, translation: [10, 0, 0] })
  console.log('[13] open 3-line + snap:', rA.maxLevel)

  // Test B: 4 lines (closed rect) + snapshot + translate — THIS should fail
  const sB = (await api.v1.curve.shape({ id: eifId, name: 'Closed4' })).result
  await api.v1.curve.line({ id: sB, startPos: [0, 30, 0], endPos: [20, 30, 0] })
  await api.v1.curve.line({ id: sB, startPos: [20, 30, 0], endPos: [20, 40, 0] })
  await api.v1.curve.line({ id: sB, startPos: [20, 40, 0], endPos: [0, 40, 0] })
  await api.v1.curve.line({ id: sB, startPos: [0, 40, 0], endPos: [0, 30, 0] })
  await snapshot('closed4')
  const rB = await api.v1.curve.translateShape({ id: sB, translation: [10, 0, 0] })
  console.log('[13] closed 4-line + snap:', rB.maxLevel, JSON.stringify(rB.messages))

  // Test C: circle (closed curve) + snapshot + translate
  const sC = (await api.v1.curve.shape({ id: eifId, name: 'Circle' })).result
  await api.v1.curve.circle({ id: sC, centerPos: [0, 60, 0], radius: 10 })
  await snapshot('circle')
  const rC = await api.v1.curve.translateShape({ id: sC, translation: [10, 0, 0] })
  console.log('[13] circle + snap:', rC.maxLevel, JSON.stringify(rC.messages))

  filewrite({
    open3: { maxLevel: rA.maxLevel, messages: rA.messages },
    closed4: { maxLevel: rB.maxLevel, messages: rB.messages },
    circle: { maxLevel: rC.maxLevel, messages: rC.messages },
  }, 'snap-bug-results')

  return { partId }
}
