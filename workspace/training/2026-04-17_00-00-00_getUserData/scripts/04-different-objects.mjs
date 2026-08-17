export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10 })).result

  const objects = { part: partId, eif: eifId, workPlane: wpId, sketch: skId, solid: boxId }
  const results = {}

  for (const [name, id] of Object.entries(objects)) {
    // Set then get on each object type
    const setR = await api.v1.common.setUserData({ id, key: 'tag', value: name })
    const getR = await api.v1.common.getUserData({ id, key: 'tag' })
    console.log(`[04] ${name} (id=${id}): set maxLevel=${setR.maxLevel}, get result=${getR.result}`)
    results[name] = { id, setMaxLevel: setR.maxLevel, getResult: getR.result, getMaxLevel: getR.maxLevel }
  }

  filewrite(results, 'different-objects')

  return { partId }
}
