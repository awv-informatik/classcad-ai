export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DirNonCustom' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  async function makeRegion(x, w, h) {
    const sk = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const lines = (await api.v1.sketch.rectangle({ id: sk, startPos: [x, 0, 0], endPos: [x + w, h, 0] })).result
    return (await api.v1.sketch.sketchRegion({ id: sk, geomIds: lines })).result
  }

  // UP with direction=[1,0,1] — is direction ignored for non-CUSTOM?
  const r1 = await makeRegion(0, 40, 40)
  const e1 = await api.v1.part.extrusion({
    id: partId, name: 'UpWithDir', references: [r1],
    type: 'UP', limit2: 50, direction: [1, 0, 1]
  })
  console.log('[13] UP + direction:', e1.result, 'maxLevel:', e1.maxLevel)
  if (e1.messages?.length) console.log('[13] msg1:', e1.messages[0].message)

  // DOWN with direction — ignored?
  const r2 = await makeRegion(60, 40, 40)
  const e2 = await api.v1.part.extrusion({
    id: partId, name: 'DownWithDir', references: [r2],
    type: 'DOWN', limit2: 50, direction: [1, 0, 1]
  })
  console.log('[13] DOWN + direction:', e2.result, 'maxLevel:', e2.maxLevel)

  // UP with negative limit2 — extrudes downward?
  const r3 = await makeRegion(120, 40, 40)
  const e3 = await api.v1.part.extrusion({
    id: partId, name: 'UpNeg', references: [r3],
    type: 'UP', limit2: -30
  })
  console.log('[13] UP + neg limit2:', e3.result, 'maxLevel:', e3.maxLevel)

  // DOWN with negative limit2 — double negative = UP?
  const r4 = await makeRegion(180, 40, 40)
  const e4 = await api.v1.part.extrusion({
    id: partId, name: 'DownNeg', references: [r4],
    type: 'DOWN', limit2: -30
  })
  console.log('[13] DOWN + neg limit2:', e4.result, 'maxLevel:', e4.maxLevel)

  filewrite({
    upWithDir: { result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages },
    downWithDir: { result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages },
    upNeg: { result: e3.result, maxLevel: e3.maxLevel, messages: e3.messages },
    downNeg: { result: e4.result, maxLevel: e4.maxLevel, messages: e4.messages },
  }, 'dir-non-custom')

  await snapshot('dir-non-custom')
  return { partId }
}
