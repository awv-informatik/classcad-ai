export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  console.log('[07] asmId:', asmId)

  // Create first template
  const t1 = (await api.v1.assembly.partTemplate({ name: 'Part_A' })).result
  console.log('[07] t1:', t1)

  // Build something in t1
  await api.v1.part.box({ id: t1, name: 'BoxA', length: 40, width: 30, height: 20 })

  // Check current context
  const checkR = await api.v1.common.getAppVersion({})
  console.log('[07] currentProduct in t1 context:', checkR.structure?.currentProduct)

  // Create second template WITHOUT switching back to assembly
  const t2 = (await api.v1.assembly.partTemplate({ name: 'Part_B' })).result
  console.log('[07] t2 (created while in t1 context):', t2)
  console.log('[07] t2 messages:', JSON.stringify((await api.v1.common.getAppVersion({})).messages))

  // Check current context after creating t2
  const check2 = await api.v1.common.getAppVersion({})
  console.log('[07] currentProduct after t2 create:', check2.structure?.currentProduct)

  // Build in t2
  const boxB = await api.v1.part.box({ id: t2, name: 'BoxB', length: 60, width: 50, height: 40 })
  console.log('[07] boxB in t2:', boxB.result, 'maxLevel:', boxB.maxLevel)
  console.log('[07] currentProduct after boxB:', boxB.structure?.currentProduct)

  // Verify PartContainer has both templates
  const container = boxB.structure?.tree?.['8']
  console.log('[07] PartContainer children:', JSON.stringify(container?.children))
  for (const childId of container?.children || []) {
    const node = boxB.structure?.tree?.[String(childId)]
    console.log(`[07] template ${childId}: name="${node?.name}"`)
  }

  return { asmId, t1, t2 }
}
