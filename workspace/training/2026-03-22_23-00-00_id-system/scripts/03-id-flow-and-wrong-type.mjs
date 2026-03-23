// Q: What happens when you pass the wrong kind of ID? (feature ID where part ID expected, vice versa)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1' })).result
  console.log('[03] partId:', partId, 'boxId:', boxId)

  // Pass feature ID (boxId) where part ID is expected
  const r1 = await api.v1.part.box({ id: boxId, name: 'WrongType' })
  console.log('[03] featureId→part.box:', r1.result !== null ? '✓' : '❌', 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages.map(m => ({ code: m.code, msg: m.message }))))

  // Pass part ID where feature ID is expected (updateBox expects feature ID)
  const r2 = await api.v1.part.updateBox({ id: partId, length: 50 })
  console.log('[03] partId→updateBox:', r2.result !== null ? '✓' : '❌', 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages.map(m => ({ code: m.code, msg: m.message }))))

  // Correct usage: pass feature ID to updateBox
  const r3 = await api.v1.part.updateBox({ id: boxId, length: 50 })
  console.log('[03] boxId→updateBox:', r3.result !== null ? '✓' : '❌', 'result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Pass sketch ID where part ID expected
  const sketchId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[03] sketchId:', sketchId)
  const r4 = await api.v1.part.box({ id: sketchId, name: 'SketchAsPart' })
  console.log('[03] sketchId→part.box:', r4.result !== null ? '✓' : '❌', 'maxLevel:', r4.maxLevel, 'msgs:', JSON.stringify(r4.messages.map(m => ({ code: m.code, msg: m.message }))))
}
