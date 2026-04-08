// 04 — Try different approaches to make union2d work
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Target' })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })

  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Tool' })).result
  await api.v1.curve.circle({ id: s2, centerPos: [25, 0, 0], radius: 30 })

  // Approach A: openFeature on EI before boolean
  console.log('[04] Approach A: openFeature on EI first...')
  await api.v1.part.openFeature({ id: eifId })
  const rA = await api.v1.curve.union2d({ target: s1, tool: s2 })
  console.log('[04] A result:', rA.result, 'maxLevel:', rA.maxLevel)
  if (rA.messages?.length) console.log('[04] A msg:', rA.messages[0].message.slice(0, 120))
  await api.v1.part.closeFeature({ id: eifId })

  // Reset: re-create shapes since the boolean may have failed/consumed them
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result

  // Approach B: try with polyline2d closed shapes instead of circles
  console.log('[04] Approach B: closed polyline2d shapes...')
  const s3 = (await api.v1.curve.shape({ id: eif2, name: 'Rect1' })).result
  await api.v1.curve.polyline2d({
    id: s3,
    points: [[0, 0, 0], [50, 0, 0], [50, 40, 0], [0, 40, 0]],
    close: true,
  })

  const s4 = (await api.v1.curve.shape({ id: eif2, name: 'Rect2' })).result
  await api.v1.curve.polyline2d({
    id: s4,
    points: [[25, 20, 0], [75, 20, 0], [75, 60, 0], [25, 60, 0]],
    close: true,
  })

  const rB = await api.v1.curve.union2d({ target: s3, tool: s4 })
  console.log('[04] B result:', rB.result, 'maxLevel:', rB.maxLevel)
  if (rB.messages?.length) console.log('[04] B msg:', rB.messages[0].message.slice(0, 120))

  // Approach C: try with advancedPolyline (closed)
  console.log('[04] Approach C: advancedPolyline closed shapes...')
  const eif3 = (await api.v1.part.entityInjection({ id: partId })).result
  const s5 = (await api.v1.curve.shape({ id: eif3, name: 'AdvPoly1' })).result
  await api.v1.curve.advancedPolyline({
    id: s5,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 50, ya: 0 },
      { xa: 50, ya: 40 },
      { xa: 0, ya: 40 },
    ],
    close: true,
  })

  const s6 = (await api.v1.curve.shape({ id: eif3, name: 'AdvPoly2' })).result
  await api.v1.curve.advancedPolyline({
    id: s6,
    pld: [
      { xa: 25, ya: 20 },
      { xa: 75, ya: 20 },
      { xa: 75, ya: 60 },
      { xa: 25, ya: 60 },
    ],
    close: true,
  })

  const rC = await api.v1.curve.union2d({ target: s5, tool: s6 })
  console.log('[04] C result:', rC.result, 'maxLevel:', rC.maxLevel)
  if (rC.messages?.length) console.log('[04] C msg:', rC.messages[0].message.slice(0, 120))

  // Approach D: try passing geometry IDs instead of shape IDs
  console.log('[04] Approach D: geometry IDs...')
  const eif4 = (await api.v1.part.entityInjection({ id: partId })).result
  const s7 = (await api.v1.curve.shape({ id: eif4 })).result
  const circR1 = await api.v1.curve.circle({ id: s7, centerPos: [0, 0, 0], radius: 30 })
  // Check what geometryIdList gives us
  const s7node = circR1.structure?.tree?.[String(s7)]
  console.log('[04] s7 geometryIdList:', s7node?.geometryIdList)

  const s8 = (await api.v1.curve.shape({ id: eif4 })).result
  await api.v1.curve.circle({ id: s8, centerPos: [25, 0, 0], radius: 30 })
  const s8node = circR1.structure?.tree?.[String(s8)]

  if (s7node?.geometryIdList?.[0]) {
    const geoId1 = s7node.geometryIdList[0]
    const geoId2 = s8node?.geometryIdList?.[0] || s8 + 1 // guess
    console.log('[04] Trying geometryIds:', geoId1, geoId2)
    const rD = await api.v1.curve.union2d({ target: geoId1, tool: geoId2 })
    console.log('[04] D result:', rD.result, 'maxLevel:', rD.maxLevel)
    if (rD.messages?.length) console.log('[04] D msg:', rD.messages[0].message.slice(0, 120))
  }

  return { partId }
}
