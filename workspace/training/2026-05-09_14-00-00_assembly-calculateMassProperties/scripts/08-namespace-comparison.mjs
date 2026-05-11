export default async function (api, { filewrite }) {
  // Create a simple assembly and compare both namespace variants
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({})).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 60, width: 40, height: 30 })
  const eifId = (await api.v1.part.entityInjection({ id: tplId, name: 'EIF' })).result
  const solidId = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20 })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
    transformation: [[50, 30, 10], [1, 0, 0], [0, 1, 0]],
  })).result

  // Compare assembly vs part namespace for each ID type
  const ids = [
    { label: 'assembly-root', id: asmId },
    { label: 'part-template', id: tplId },
    { label: 'instance', id: inst },
    { label: 'solid', id: solidId },
  ]

  const results = {}
  for (const { label, id } of ids) {
    const rAsm = await api.v1.assembly.calculateMassProperties({ id })
    const rPart = await api.v1.part.calculateMassProperties({ id })
    const identical = JSON.stringify(rAsm.result) === JSON.stringify(rPart.result)
    results[label] = { asm: rAsm.result, part: rPart.result, identical }
    console.log(`[08] ${label}: identical=${identical}`)
    if (!identical) {
      console.log(`[08]   asm:`, JSON.stringify(rAsm.result))
      console.log(`[08]   part:`, JSON.stringify(rPart.result))
    }
  }

  filewrite(results, 'namespace-comparison')
  return { asmId }
}
