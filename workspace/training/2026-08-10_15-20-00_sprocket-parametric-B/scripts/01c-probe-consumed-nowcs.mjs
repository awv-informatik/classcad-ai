/**
 * 01c (variant B) — isolate the consumed-tool regen corruption:
 * same expression-driven cylinder tool, but NO workCSys (default placement).
 * If regen is exact here, the corruption is the workCSys placement being
 * lost/misapplied when a consumed tool regenerates.
 */
export default async function (api, { snapshot, filewrite }) {
  const vol = async (id) => (await api.v1.part.calculateMassProperties({ id })).result.volume
  const partId = (await api.v1.part.create({ name: 'NoWcs' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'D', value: 20 }] })
  // box centered on origin in XY, z 0..10; cylinder default base z=0..20 at origin
  const box = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 80, height: 10, translation: [-40, -40, 0] })).result
  const cyl = (await api.v1.part.cylinder({ id: partId, name: 'Hole', diameter: '@expr.D', height: 20 })).result
  await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: box, tools: [cyl] })
  await api.v1.common.recalc({})
  const v1 = await vol(partId)
  const up = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'D', value: 30 }] })
  await api.v1.common.recalc({})
  const v2 = await vol(partId)
  await snapshot('after')
  const expected = Math.PI * (15 ** 2 - 10 ** 2) * 10
  const out = {
    volBefore: v1, volAfter: v2,
    deltaObserved: +(v1 - v2).toFixed(1), deltaExpected: +expected.toFixed(1),
    cleanRegen: Math.abs(v1 - v2 - expected) < 50,
  }
  console.log('[01c] no-wcs consumed tool:', JSON.stringify(out))
  filewrite(out, 'consumed-nowcs')
  return out
}
