// 06 — VERIFY sketch.loadFrom (its doc is marked UNVERIFIED). Round-trip: build source sketches, save the drawing
// to OFB (base64) via common.save, then loadFrom that data into fresh sketches on the same part.
// Checks: data+base64 path, return VOID, merge vs replace, `name` sketch-selection, and error cases.
import { makeSketch, addSketch, line, circle } from './_setup.mjs'

const counts = g => ({ lines: g.lines.length, circles: (g.circles || []).length, arcs: (g.arcs || []).length })
const sum = (r, label) => ({ label, result: r?.result ?? null, maxLevel: r?.maxLevel, msgs: (r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message })) })
const geo = async (api, id) => counts((await api.v1.sketch.getGeometry({ id })).result)

export default async function (api, { filewrite }) {
  const out = {}
  // SOURCE: sketch 'S' = circle, sketch 'B' = rectangle (2 named sketches in the OFB)
  const { partId, skId: skS, planeId } = await makeSketch(api, { name: 'LoadFrom' }) // sketch name 'S'
  await circle(api, skS, [10, 10, 0], 5)
  const skB = await addSketch(api, partId, planeId, 'B')
  await api.v1.sketch.rectangle({ id: skB, startPos: [0, 0, 0], endPos: [40, 30, 0] })

  // SAVE whole drawing to OFB base64
  const saveR = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  const ofb = saveR?.result?.content
  out.save = { hasContent: !!ofb, contentLen: ofb?.length, keys: Object.keys(saveR?.result || {}), maxLevel: saveR?.maxLevel }

  // dest1: has a pre-existing line (merge test); loadFrom WITHOUT name -> first sketch
  const d1 = await addSketch(api, partId, planeId, 'D1')
  await line(api, d1, [0, 60, 0], [10, 60, 0])
  const d1Before = await geo(api, d1)
  const rNoName = await api.v1.sketch.loadFrom({ id: d1, partId, data: ofb, encoding: 'base64', format: 'OFB' })
  out.noName = { ...sum(rNoName, 'loadFrom data, no name'), d1Before, d1After: await geo(api, d1) }

  // dest2: loadFrom name:'B' -> rectangle (4 lines)
  const d2 = await addSketch(api, partId, planeId, 'D2')
  const rNameB = await api.v1.sketch.loadFrom({ id: d2, partId, data: ofb, encoding: 'base64', format: 'OFB', name: 'B' })
  out.nameB = { ...sum(rNameB, "loadFrom name:'B'"), after: await geo(api, d2) }

  // dest3: loadFrom name:'S' -> circle
  const d3 = await addSketch(api, partId, planeId, 'D3')
  const rNameS = await api.v1.sketch.loadFrom({ id: d3, partId, data: ofb, encoding: 'base64', format: 'OFB', name: 'S' })
  out.nameS = { ...sum(rNameS, "loadFrom name:'S'"), after: await geo(api, d3) }

  // dest4: loadFrom name:'DOESNOTEXIST'
  const d4 = await addSketch(api, partId, planeId, 'D4')
  const rBadName = await api.v1.sketch.loadFrom({ id: d4, partId, data: ofb, encoding: 'base64', format: 'OFB', name: 'NOPE' })
  out.badName = { ...sum(rBadName, "loadFrom name:'NOPE'"), after: await geo(api, d4) }

  // errors: missing partId ; garbage data ; no source at all
  const d5 = await addSketch(api, partId, planeId, 'D5')
  out.noPartId = sum(await api.v1.sketch.loadFrom({ id: d5, data: ofb, encoding: 'base64', format: 'OFB' }), 'no partId')
  out.badData = sum(await api.v1.sketch.loadFrom({ id: d5, partId, data: 'not-real-ofb', encoding: 'base64', format: 'OFB' }), 'garbage data')
  out.noSource = sum(await api.v1.sketch.loadFrom({ id: d5, partId, format: 'OFB' }), 'no data/url/file')

  filewrite(out, '06-loadFrom')
  console.log('[06] save', JSON.stringify(out.save))
  console.log('[06] noName', JSON.stringify({ d1Before: out.noName.d1Before, d1After: out.noName.d1After, result: out.noName.result, max: out.noName.maxLevel, msgs: out.noName.msgs }))
  console.log('[06] nameB', JSON.stringify({ after: out.nameB.after, msgs: out.nameB.msgs }))
  console.log('[06] nameS', JSON.stringify({ after: out.nameS.after, msgs: out.nameS.msgs }))
  console.log('[06] badName', JSON.stringify({ after: out.badName.after, msgs: out.badName.msgs }))
  console.log('[06] noPartId', JSON.stringify(out.noPartId.msgs), '| badData', JSON.stringify(out.badData.msgs), '| noSource', JSON.stringify(out.noSource.msgs))
  return { ok: true }
}
