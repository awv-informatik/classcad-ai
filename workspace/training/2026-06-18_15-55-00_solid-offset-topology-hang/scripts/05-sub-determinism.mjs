// Is the 3-cylinder subtraction itself deterministic? Run it 6x on fresh parts.
export default async function (api, { filewrite }) {
  const results = []
  for (let i = 0; i < 6; i++) {
    const partId = (await api.v1.part.create({ name: 'SubDet' + i })).result
    const eifId = (await api.v1.part.entityInjection({ id: partId })).result
    const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
    const c1 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [15, 15, -5] })).result
    const c2 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [45, 15, -5] })).result
    const c3 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [30, 30, -5] })).result
    const r = await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [c1, c2, c3] })
    results.push({ run: i, maxLevel: r.maxLevel, msg: r.messages?.[0]?.message?.slice(0, 70) || '' })
    await api.v1.common.clear({})
  }
  for (const x of results) console.log(`run ${x.run}: maxLevel=${x.maxLevel} ${x.msg}`)
  filewrite(results, 'sub-determinism')
  return results
}
