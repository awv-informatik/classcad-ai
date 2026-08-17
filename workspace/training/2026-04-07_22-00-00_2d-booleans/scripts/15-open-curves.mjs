// 15 — Do booleans work on open curves (not closed)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: open polyline (NOT closed)
  const s1 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.polyline2d({
    id: s1,
    points: [[0, 0, 0], [50, 0, 0], [50, 30, 0], [0, 30, 0]],
    close: false, // open!
  })

  // Shape 2: closed circle
  const s2 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: s2, centerPos: [25, 15, 0], radius: 20 })

  const r = await api.v1.curve.union2d({ target: s1, tool: s2 })
  console.log('[15] open target + closed tool: maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[15] msg:', r.messages[0].message.slice(0, 120))

  // Reverse: closed target, open tool
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const s3 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.circle({ id: s3, centerPos: [0, 0, 0], radius: 30 })
  const s4 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.line({ id: s4, startPos: [-40, 0, 0], endPos: [40, 0, 0] })

  const r2 = await api.v1.curve.union2d({ target: s3, tool: s4 })
  console.log('[15] closed target + open tool (line): maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[15] msg:', r2.messages[0].message.slice(0, 120))

  return { partId }
}
