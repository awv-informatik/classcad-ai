export default async function (api, { filewrite }) {
  // Test: calculateMassProperties on an empty assembly (no templates/instances)
  const asmId = (await api.v1.assembly.create({ name: 'EmptyAsm' })).result
  console.log('[06] asmId:', asmId)

  const mp = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[06] mass props result:', JSON.stringify(mp.result))
  console.log('[06] mass props maxLevel:', mp.maxLevel)
  console.log('[06] mass props messages:', JSON.stringify(mp.messages))

  filewrite({ result: mp.result, maxLevel: mp.maxLevel, messages: mp.messages }, 'empty-mass-props')

  return { asmId }
}
