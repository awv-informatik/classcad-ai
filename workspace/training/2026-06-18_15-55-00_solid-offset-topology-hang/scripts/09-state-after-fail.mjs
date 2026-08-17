// Dump the database state after the one-call 3-tool subtraction fails, to see what's
// left dangling (which then makes STEP export loop). No save() — that hangs.
export default async function (api, { filewrite, tree }) {
  const partId = (await api.v1.part.create({ name: 'FailState' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const c1 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [15, 15, -5] })).result
  const c2 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [45, 15, -5] })).result
  const c3 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [30, 30, -5] })).result
  console.log(`ids: box=${boxId} c1=${c1} c2=${c2} c3=${c3}`)

  const sub = await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [c1, c2, c3] })
  console.log(`sub maxLevel=${sub.maxLevel} msg=${sub.messages?.[0]?.message?.slice(0,80)}`)

  // Which ids still exist?
  const exists = {}
  for (const [name, id] of [['box', boxId], ['c1', c1], ['c2', c2], ['c3', c3]]) {
    const t = await tree({ id })
    exists[name] = { id, present: !!t, class: t?.class }
  }
  console.log('exists:', JSON.stringify(exists))

  // Entities under the EIF
  const full = await tree({ refresh: true })
  filewrite({ ids: { boxId, c1, c2, c3 }, subMaxLevel: sub.maxLevel, subMsg: sub.messages, exists, tree: full }, 'state-after-fail')
  return exists
}
