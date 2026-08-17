// Error cases: missing required parameters
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylinderErrors' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Missing height
  const r1 = await api.v1.solid.cylinder({ id: eifId, diameter: 50 })
  console.log('[06] missing height — result:', r1.result, 'maxLevel:', r1.maxLevel, 'msg:', r1.messages?.[0]?.message)

  // Missing diameter
  const r2 = await api.v1.solid.cylinder({ id: eifId, height: 50 })
  console.log('[06] missing diameter — result:', r2.result, 'maxLevel:', r2.maxLevel, 'msg:', r2.messages?.[0]?.message)

  // Missing id
  const r3 = await api.v1.solid.cylinder({ height: 50, diameter: 50 })
  console.log('[06] missing id — result:', r3.result, 'maxLevel:', r3.maxLevel, 'msg:', r3.messages?.[0]?.message)

  // Wrong id type (part ID instead of EIF ID)
  const r4 = await api.v1.solid.cylinder({ id: partId, height: 50, diameter: 50 })
  console.log('[06] wrong id type — result:', r4.result, 'maxLevel:', r4.maxLevel, 'msg:', r4.messages?.[0]?.message)

  filewrite({
    missingHeight: { result: r1.result, maxLevel: r1.maxLevel, msg: r1.messages },
    missingDiameter: { result: r2.result, maxLevel: r2.maxLevel, msg: r2.messages },
    missingId: { result: r3.result, maxLevel: r3.maxLevel, msg: r3.messages },
    wrongIdType: { result: r4.result, maxLevel: r4.maxLevel, msg: r4.messages },
  }, 'error-responses')

  return { partId, eifId }
}
