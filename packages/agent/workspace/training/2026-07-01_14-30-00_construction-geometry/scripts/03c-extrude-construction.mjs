// 03c — ISOLATION: extrude a CONSTRUCTION-only closed square. Expect PreCheckVisitor rejection ("construction
// curve"). If it hangs instead (worker timeout), that's the finding — construction extrude isn't guarded here.
import { makeSketch } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { partId, skId } = await makeSketch(api, { name: 'ExtrudeC' })
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 40, 0], isConstruction: true })).result
  const r = await api.v1.part.extrusion({ id: partId, references: rect, limit2: 25 })
  const out = { rect, result: r?.result ?? null, rejected: r?.result == null, maxLevel: r?.maxLevel, msgs: (r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message?.slice(0, 160) })) }
  filewrite(out, '03c-extrude-construction')
  console.log('[03c] construction rect', JSON.stringify(rect), '| result', out.result, 'rejected', out.rejected, 'max', out.maxLevel, '| msgs', JSON.stringify(out.msgs))
  return out
}
