// 16 — Shapes in different planes: XY vs XZ
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1 in XY plane (z=0)
  const s1 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })

  // Shape 2 in XZ plane (y=0)
  const s2 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: s2, centerPos: [20, 0, 0], radius: 30 })
  // Wait — both circles are at z=0 and y=0 so they ARE in the same plane (XY).
  // Let me make s2 actually in a different plane
  // A circle in the XZ plane: points at (x, 0, z)
  // But curve.circle only takes centerPos and radius... it doesn't take a normal/plane
  // Let me use polyline2d with non-zero z values to force a different plane

  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const s3 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.polyline2d({
    id: s3,
    points: [[0, 0, 0], [50, 0, 0], [50, 40, 0], [0, 40, 0]], // XY plane
    close: true,
  })

  const s4 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.polyline2d({
    id: s4,
    points: [[20, 0, 0], [70, 0, 0], [70, 0, 40], [20, 0, 40]], // XZ plane (y=0)
    close: true,
  })

  const r = await api.v1.curve.union2d({ target: s3, tool: s4 })
  console.log('[16] diff planes: maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[16] msg:', r.messages[0].message.slice(0, 150))

  return { partId }
}
