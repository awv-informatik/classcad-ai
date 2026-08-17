// Pin down post-fix behavior of subtraction with non-overlapping tools (single vs multi).
export default async function (api) {
  const setup = async () => {
    const part = (await api.v1.part.create({})).result
    const eif = (await api.v1.part.entityInjection({ id: part })).result
    return eif
  }
  const box = async (eif) => (await api.v1.solid.box({ id: eif, length: 60, width: 40, height: 30 })).result
  // box centered: x[-30,30] y[-20,20]; cyl at x=45 is OUTSIDE (non-overlapping)
  const cylOut = async (eif) => (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [45, 15, -5] })).result
  const cylIn  = async (eif) => (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [15, 15, -5] })).result
  const vol = async (id) => { const m = await api.v1.part.calculateMassProperties({ id }).catch(()=>({})); return m.result?.volume ?? '-' }

  // A) single non-overlapping tool
  let eif = await setup(); let b = await box(eif); let co = await cylOut(eif)
  let r = await api.v1.solid.subtraction({ id: eif, target: b, tools: [co] })
  console.log(`A single-nonoverlap: maxLevel ${r.maxLevel} boxVol ${await vol(b)} msgs ${JSON.stringify(r.messages?.map(m=>m.code+':'+m.message?.slice(0,55)))}`)

  // B) single overlapping tool (baseline)
  eif = await setup(); b = await box(eif); let ci = await cylIn(eif)
  r = await api.v1.solid.subtraction({ id: eif, target: b, tools: [ci] })
  console.log(`B single-overlap:    maxLevel ${r.maxLevel} boxVol ${await vol(b)} msgs ${JSON.stringify(r.messages?.map(m=>m.code))}`)

  // C) multi: [overlap, nonoverlap]
  eif = await setup(); b = await box(eif); ci = await cylIn(eif); co = await cylOut(eif)
  r = await api.v1.solid.subtraction({ id: eif, target: b, tools: [ci, co] })
  console.log(`C multi [in,out]:    maxLevel ${r.maxLevel} boxVol ${await vol(b)} msgs ${JSON.stringify(r.messages?.map(m=>m.code+':'+m.message?.slice(0,55)))}`)
}
