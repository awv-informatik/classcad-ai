// Single tangent cylinder (touches box y=20 face) subtraction, repeated, full output.
export default async function (api) {
  for (let i = 0; i < 3; i++) {
    const part = (await api.v1.part.create({})).result
    const eif = (await api.v1.part.entityInjection({ id: part })).result
    const b = (await api.v1.solid.box({ id: eif, length: 60, width: 40, height: 30 })).result
    const cyl = (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [15, 15, -5] })).result
    const r = await api.v1.solid.subtraction({ id: eif, target: b, tools: [cyl] })
    console.log(`run${i}: maxLevel ${r.maxLevel} result ${r.result} msgs ${JSON.stringify(r.messages?.map(m=>m.code+':'+(m.message||'').slice(0,70)))}`)
  }
}
