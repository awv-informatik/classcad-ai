// Q: How does part.box (feature-level) differ from solid.box (direct geometry)?
// part.box takes a part ID, solid.box takes an EI ID. Compare.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // part.box — creates a box FEATURE in the part
  const partBoxR = await api.v1.part.box({ id: partId, length: 60, width: 40, height: 30 })
  console.log('[10] part.box — result:', partBoxR.result, 'maxLevel:', partBoxR.maxLevel)

  await snapshot('part-box-feature')

  // Now create an EI and use solid.box — creates direct geometry in the EI
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'DirectGeo' })).result
  const solidBoxR = await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30, translation: [100, 0, 0] })
  console.log('[10] solid.box — result:', solidBoxR.result, 'maxLevel:', solidBoxR.maxLevel)

  await snapshot('part-box-plus-solid-box')

  filewrite({
    partBox: { id: partBoxR.result, maxLevel: partBoxR.maxLevel },
    solidBox: { id: solidBoxR.result, maxLevel: solidBoxR.maxLevel },
    partId, eifId,
  }, 'feature-vs-direct-ids')

  return { partId, eifId, partBoxId: partBoxR.result, solidBoxId: solidBoxR.result }
}
