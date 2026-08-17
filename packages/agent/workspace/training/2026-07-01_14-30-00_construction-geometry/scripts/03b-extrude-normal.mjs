// 03b — ISOLATION: does part.extrusion on a NORMAL closed square work (and how fast)? If yes, 03c tests construction.
import { makeSketch } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { partId, skId } = await makeSketch(api, { name: 'ExtrudeN' })
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 40, 0] })).result
  const r = await api.v1.part.extrusion({ id: partId, references: rect, limit2: 25 })
  const out = { rect, result: r?.result ?? null, ok: r?.result != null, maxLevel: r?.maxLevel, msgs: (r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message?.slice(0, 140) })) }
  filewrite(out, '03b-extrude-normal')
  console.log('[03b] rect', JSON.stringify(rect), '| extrusion result', out.result, 'ok', out.ok, 'max', out.maxLevel, '| msgs', JSON.stringify(out.msgs))
  return out
}
