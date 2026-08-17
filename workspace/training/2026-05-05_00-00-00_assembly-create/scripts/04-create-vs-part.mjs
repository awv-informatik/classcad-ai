export default async function (api, { filewrite }) {
  // Test: does assembly.create clear the drawing like part.create does?
  // First create a part with geometry
  const partId = (await api.v1.part.create({ name: 'ExistingPart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  console.log('[04] part+box created, partId:', partId, 'boxId:', boxId)

  // Now create an assembly — does it wipe the part?
  const r = await api.v1.assembly.create({ name: 'AfterPart' })
  console.log('[04] assembly.create result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite(r.structure, 'structure-after-asm-over-part')

  return { partId, asmId: r.result }
}
