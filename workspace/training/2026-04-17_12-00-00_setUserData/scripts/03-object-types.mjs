export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ObjTypeTest' })).result

  // Entity injection feature
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Work plane
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result

  // Work axis
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'WA1', origin: [0, 0, 0], direction: [0, 1, 0] })).result

  // Sketch
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Sketch line
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result

  // Solid box inside entity injection
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

  const targets = [
    { name: 'part', id: partId },
    { name: 'entityInjection', id: eifId },
    { name: 'workPlane', id: wpId },
    { name: 'workAxis', id: waId },
    { name: 'sketch', id: skId },
    { name: 'sketchLine', id: lineId },
    { name: 'solid', id: boxId },
  ]

  const results = []
  for (const t of targets) {
    const setR = await api.v1.common.setUserData({ id: t.id, key: 'test', value: 'hello' })
    const getR = await api.v1.common.getUserData({ id: t.id, key: 'test' })
    const ok = getR.result === 'hello'
    console.log(`[03] ${t.name} (id=${t.id}): set maxLevel=${setR.maxLevel}, get=${JSON.stringify(getR.result)} ${ok ? '✓' : '❌'}`)
    results.push({ name: t.name, id: t.id, setMaxLevel: setR.maxLevel, getValue: getR.result, ok })
  }

  filewrite(results, 'object-types')
  return { partId }
}
