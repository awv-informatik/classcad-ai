// Q: Can you create multiple solids in the same entity injection?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MyEI' })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 80, translation: [70, 0, 0] })).result
  const cyl = (await api.v1.solid.cylinder({ id: eifId, diameter: 40, height: 60, translation: [0, 70, 0] })).result

  console.log('[05] box1:', box1, 'box2:', box2, 'cyl:', cyl)
  console.log('[05] All three created in same EI:', eifId)

  await snapshot('multiple-solids-one-ei')
  filewrite({ eifId, box1, box2, cyl }, 'multiple-solids-ids')

  return { partId, eifId, box1, box2, cyl }
}
