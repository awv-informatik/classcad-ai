// Error cases: wrong id types, missing params, consumed solid
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorErrors' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const toolId = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20, translation: [40, 0, 0] })).result

  const errors = {}

  // 1. Pass part ID instead of EIF ID
  try {
    const r = await api.v1.solid.mirror({
      id: partId, target: boxId,
      originPos: [0, 0, 0], normal: [1, 0, 0],
    })
    errors.wrongIdType = { maxLevel: r.maxLevel, messages: r.messages, result: r.result }
    console.log('[13] wrong id type: maxLevel=', r.maxLevel)
  } catch (e) {
    errors.wrongIdType = { error: e.message }
    console.log('[13] wrong id type: error=', e.message)
  }

  // 2. Missing target param
  try {
    const r = await api.v1.solid.mirror({
      id: eifId,
      originPos: [0, 0, 0], normal: [1, 0, 0],
    })
    errors.missingTarget = { maxLevel: r.maxLevel, messages: r.messages }
    console.log('[13] missing target: maxLevel=', r.maxLevel)
  } catch (e) {
    errors.missingTarget = { error: e.message }
    console.log('[13] missing target: error=', e.message)
  }

  // 3. Missing originPos
  try {
    const r = await api.v1.solid.mirror({
      id: eifId, target: boxId,
      normal: [1, 0, 0],
    })
    errors.missingOriginPos = { maxLevel: r.maxLevel, messages: r.messages }
    console.log('[13] missing originPos: maxLevel=', r.maxLevel)
  } catch (e) {
    errors.missingOriginPos = { error: e.message }
    console.log('[13] missing originPos: error=', e.message)
  }

  // 4. Missing normal
  try {
    const r = await api.v1.solid.mirror({
      id: eifId, target: boxId,
      originPos: [0, 0, 0],
    })
    errors.missingNormal = { maxLevel: r.maxLevel, messages: r.messages }
    console.log('[13] missing normal: maxLevel=', r.maxLevel)
  } catch (e) {
    errors.missingNormal = { error: e.message }
    console.log('[13] missing normal: error=', e.message)
  }

  // 5. Consumed tool solid (boolean without keepTools)
  await api.v1.solid.union({ id: eifId, target: boxId, tools: [toolId] })
  // toolId is now consumed
  try {
    const r = await api.v1.solid.mirror({
      id: eifId, target: toolId,
      originPos: [0, 0, 0], normal: [1, 0, 0],
    })
    errors.consumedSolid = { maxLevel: r.maxLevel, messages: r.messages }
    console.log('[13] consumed solid: maxLevel=', r.maxLevel)
  } catch (e) {
    errors.consumedSolid = { error: e.message }
    console.log('[13] consumed solid: error=', e.message)
  }

  // 6. Missing id param entirely
  try {
    const r = await api.v1.solid.mirror({
      target: boxId,
      originPos: [0, 0, 0], normal: [1, 0, 0],
    })
    errors.missingId = { maxLevel: r.maxLevel, messages: r.messages }
    console.log('[13] missing id: maxLevel=', r.maxLevel)
  } catch (e) {
    errors.missingId = { error: e.message }
    console.log('[13] missing id: error=', e.message)
  }

  filewrite(errors, 'error-cases')
  return { errors }
}
