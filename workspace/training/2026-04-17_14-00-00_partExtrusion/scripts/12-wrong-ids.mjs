export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongIds' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const sk = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const lines = (await api.v1.sketch.rectangle({ id: sk, startPos: [0, 0, 0], endPos: [50, 30, 0] })).result
  const region = (await api.v1.sketch.sketchRegion({ id: sk, geomIds: lines })).result

  // Wrong: pass sketch ID instead of part ID
  const e1 = await api.v1.part.extrusion({ id: sk, name: 'WrongId1', references: [region], limit2: 40 })
  console.log('[12] sketchId as id:', e1.result, 'maxLevel:', e1.maxLevel)
  if (e1.messages?.length) console.log('[12] msg1:', e1.messages[0].message)

  // Wrong: pass region ID as id (instead of part ID)
  const e2 = await api.v1.part.extrusion({ id: region, name: 'WrongId2', references: [region], limit2: 40 })
  console.log('[12] regionId as id:', e2.result, 'maxLevel:', e2.maxLevel)
  if (e2.messages?.length) console.log('[12] msg2:', e2.messages[0].message)

  // Wrong: references = [] (empty)
  const e3 = await api.v1.part.extrusion({ id: partId, name: 'EmptyRef', references: [], limit2: 40 })
  console.log('[12] empty references:', e3.result, 'maxLevel:', e3.maxLevel)
  if (e3.messages?.length) console.log('[12] msg3:', e3.messages[0].message)

  // Wrong: references omitted entirely
  const e4 = await api.v1.part.extrusion({ id: partId, name: 'NoRef', limit2: 40 })
  console.log('[12] no references:', e4.result, 'maxLevel:', e4.maxLevel)
  if (e4.messages?.length) console.log('[12] msg4:', e4.messages[0].message)

  // Pass line ID (not region) directly — should still work per docs
  const e5 = await api.v1.part.extrusion({ id: partId, name: 'LineRef', references: [lines[0]], limit2: 40 })
  console.log('[12] single line ref:', e5.result, 'maxLevel:', e5.maxLevel)
  if (e5.messages?.length) console.log('[12] msg5:', e5.messages[0].message)

  filewrite({
    sketchAsId: { result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages },
    regionAsId: { result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages },
    emptyRef: { result: e3.result, maxLevel: e3.maxLevel, messages: e3.messages },
    noRef: { result: e4.result, maxLevel: e4.maxLevel, messages: e4.messages },
    singleLineRef: { result: e5.result, maxLevel: e5.maxLevel, messages: e5.messages },
  }, 'wrong-ids')

  return { partId }
}
