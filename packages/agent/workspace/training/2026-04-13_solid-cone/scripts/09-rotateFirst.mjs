// rotateFirst flag — compare true vs false with same rotation + translation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotateFirstTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const params = {
    height: 80, bDiameter: 50, tDiameter: 10,
    rotation: [0, 0, Math.PI / 4],  // 45° around Z
    translation: [100, 0, 0]
  }

  // rotateFirst = true (default) — rotate then translate
  const r1 = await api.v1.solid.cone({ id: eifId, ...params, rotateFirst: true })
  console.log('[09] rotateFirst=true result:', r1.result, 'maxLevel:', r1.maxLevel)

  // rotateFirst = false — translate then rotate (orbits origin)
  const r2 = await api.v1.solid.cone({ id: eifId, ...params, rotateFirst: false })
  console.log('[09] rotateFirst=false result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('rotateFirst-comparison')
  return { partId, eifId }
}
