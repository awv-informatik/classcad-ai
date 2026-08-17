// Test: translation parameter on box — verify it offsets from origin
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslationTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box at origin (reference)
  const box1 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40 })).result
  console.log('[01] box1 (origin):', box1)

  // Box translated in X
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40, translation: [80, 0, 0] })).result
  console.log('[01] box2 (tx=80):', box2)

  // Box translated in Y
  const box3 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40, translation: [0, 80, 0] })).result
  console.log('[01] box3 (ty=80):', box3)

  // Box translated in Z
  const box4 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40, translation: [0, 0, 80] })).result
  console.log('[01] box4 (tz=80):', box4)

  // Box translated in all three axes
  const box5 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40, translation: [80, 80, 80] })).result
  console.log('[01] box5 (t=80,80,80):', box5)

  await snapshot('translation-boxes')
  return { partId, box1, box2, box3, box4, box5 }
}
