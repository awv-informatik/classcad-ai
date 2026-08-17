// Test: Is tools: [A, B, C] in one call equivalent to 3 sequential single-tool calls?
// Compare structure tree sizes for union and subtraction
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiVsSeq' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // --- MULTI-TOOL union ---
  const base1 = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60 })).result
  const t1a = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 40, translation: [80, 10, 0] })).result
  const t1b = (await api.v1.solid.cylinder({ id: eifId, diameter: 20, height: 30, translation: [50, 40, 60] })).result
  const t1c = (await api.v1.solid.box({ id: eifId, length: 20, width: 50, height: 20, translation: [10, 60, 0] })).result

  const rMulti = await api.v1.solid.union({ id: eifId, target: base1, tools: [t1a, t1b, t1c] })
  console.log('[09] multi-tool union: maxLevel=', rMulti.maxLevel, 'result=', rMulti.result)
  filewrite(rMulti.structure, 'multi-structure')
  await snapshot('multi-union')

  // --- SEQUENTIAL union (fresh setup, same geometry) ---
  await api.v1.solid.deleteSolid({ id: eifId })

  const base2 = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60 })).result
  const t2a = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 40, translation: [80, 10, 0] })).result
  const t2b = (await api.v1.solid.cylinder({ id: eifId, diameter: 20, height: 30, translation: [50, 40, 60] })).result
  const t2c = (await api.v1.solid.box({ id: eifId, length: 20, width: 50, height: 20, translation: [10, 60, 0] })).result

  await api.v1.solid.union({ id: eifId, target: base2, tools: [t2a] })
  await api.v1.solid.union({ id: eifId, target: base2, tools: [t2b] })
  const rSeq = await api.v1.solid.union({ id: eifId, target: base2, tools: [t2c] })
  console.log('[09] sequential union: maxLevel=', rSeq.maxLevel, 'result=', rSeq.result)
  filewrite(rSeq.structure, 'seq-structure')
  await snapshot('seq-union')

  return { partId }
}
