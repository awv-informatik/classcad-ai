export default async function (api) {
  const mk = async () => {
    const part = (await api.v1.part.create({})).result
    const eif = (await api.v1.part.entityInjection({ id: part })).result
    const b = (await api.v1.solid.box({ id: eif, length: 60, width: 40, height: 30 })).result
    return { eif, b }
  }
  const tan = async (eif) => (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [15, 15, -5] })).result
  const out = async (eif) => (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [45, 15, -5] })).result
  const fmt = r => `maxLevel ${r.maxLevel} result ${r.result} msgs ${JSON.stringify(r.messages?.map(m=>m.code+':'+(m.message||'').slice(0,60)))}`

  // Force the flaky branch: do one tangent sub first to warm state, then test both modes.
  for (let i = 0; i < 2; i++) {
    let { eif, b } = await mk(); let c = await tan(eif)
    console.log(`tangent keepTools=FALSE run${i}: ${fmt(await api.v1.solid.subtraction({ id: eif, target: b, tools: [c] }))}`)
  }
  for (let i = 0; i < 2; i++) {
    let { eif, b } = await mk(); let c = await tan(eif)
    console.log(`tangent keepTools=TRUE  run${i}: ${fmt(await api.v1.solid.subtraction({ id: eif, target: b, tools: [c], keepTools: true }))}`)
  }
  // canonical repro (clearly-disjoint tool) must stay a clean deterministic error
  for (let i = 0; i < 2; i++) {
    let { eif, b } = await mk(); let ci = await tan(eif); let co = await out(eif)
    console.log(`canonical [in,out] run${i}: ${fmt(await api.v1.solid.subtraction({ id: eif, target: b, tools: [ci, co] }))}`)
  }
}
