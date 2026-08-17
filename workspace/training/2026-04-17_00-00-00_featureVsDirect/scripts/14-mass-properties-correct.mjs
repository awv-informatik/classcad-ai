export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MassTest' })).result

  // Feature box
  const featBoxId = (await api.v1.part.box({
    id: partId, name: 'FeatBox', length: 80, width: 60, height: 40,
  })).result

  // EIF + solid box
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const solidBoxId = (await api.v1.solid.box({
    id: eifId, length: 50, width: 50, height: 50,
    translation: [120, 0, 0],
  })).result

  // calculateMassProperties with PART ID (should include all bodies)
  const massPartR = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[14] mass for partId:', massPartR.result ? 'ok' : 'null', 'maxLevel:', massPartR.maxLevel)
  filewrite({ result: massPartR.result, messages: massPartR.messages, maxLevel: massPartR.maxLevel }, 'mass-part-id')

  // calculateMassProperties with solid ID (worked in script 08)
  const massSolidR = await api.v1.part.calculateMassProperties({ id: solidBoxId })
  console.log('[14] mass for solidId:', massSolidR.result ? 'ok' : 'null', 'maxLevel:', massSolidR.maxLevel)
  filewrite({ result: massSolidR.result, messages: massSolidR.messages, maxLevel: massSolidR.maxLevel }, 'mass-solid-id')

  // calculateMassProperties with feature ID (failed in script 08)
  const massFeatR = await api.v1.part.calculateMassProperties({ id: featBoxId })
  console.log('[14] mass for featId:', massFeatR.result ? 'ok' : 'null', 'maxLevel:', massFeatR.maxLevel)
  filewrite({ result: massFeatR.result, messages: massFeatR.messages, maxLevel: massFeatR.maxLevel }, 'mass-feat-id')

  // calculateMassProperties with EIF ID
  const massEifR = await api.v1.part.calculateMassProperties({ id: eifId })
  console.log('[14] mass for eifId:', massEifR.result ? 'ok' : 'null', 'maxLevel:', massEifR.maxLevel)
  filewrite({ result: massEifR.result, messages: massEifR.messages, maxLevel: massEifR.maxLevel }, 'mass-eif-id')

  // Expected volumes: feat box = 80*60*40 = 192000, solid box = 50*50*50 = 125000
  console.log('[14] Expected: feat=192000, solid=125000, total=317000')

  return { partId, featBoxId, solidBoxId, eifId }
}
