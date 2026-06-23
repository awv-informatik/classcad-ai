// One clean single-tool overlapping subtraction, full diagnostics.
export default async function (api) {
  const part = (await api.v1.part.create({})).result
  const eif = (await api.v1.part.entityInjection({ id: part })).result
  console.log('part', part, 'eif', eif)
  const b = (await api.v1.solid.box({ id: eif, length: 60, width: 40, height: 30 })).result
  // fully-interior cylinder: x=0,y=0, radius 5 -> well inside x[-30,30] y[-20,20]
  const cyl = (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [0, 0, 0] })).result
  console.log('box', b, 'cyl', cyl)
  const r = await api.v1.solid.subtraction({ id: eif, target: b, tools: [cyl] })
  console.log('subtraction:', JSON.stringify({ maxLevel: r.maxLevel, result: r.result, messages: r.messages }))
  const mp = await api.v1.part.calculateMassProperties({ id: b }).catch(e => ({ error: e.message }))
  console.log('box massprops: maxLevel', mp.maxLevel, 'vol', mp.result?.volume)
}
