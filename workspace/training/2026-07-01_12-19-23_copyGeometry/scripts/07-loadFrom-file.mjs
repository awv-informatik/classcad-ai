// 07 — verify the `file:` source of loadFrom using a real .ofb on disk (worker runs locally so the path is
// reachable). The rigging-plate OFB has a sketch 'S' with many lines/arcs/circles.
import { makeSketch, addSketch } from './_setup.mjs'

const OFB = '/Users/dev/dev/awv/classcad-agent/workspace/training/2026-07-01_10-03-15_rigging-plate/files/01-skeleton-01-skeleton.ofb'
const counts = g => ({ lines: g.lines.length, circles: (g.circles || []).length, arcs: (g.arcs || []).length })

export default async function (api, { filewrite }) {
  const { partId, planeId } = await makeSketch(api, { name: 'LoadFromFile' })
  const dest = await addSketch(api, partId, planeId, 'DEST')
  const before = counts((await api.v1.sketch.getGeometry({ id: dest })).result)
  const r = await api.v1.sketch.loadFrom({ id: dest, partId, file: OFB, format: 'OFB', name: 'S' })
  const after = counts((await api.v1.sketch.getGeometry({ id: dest })).result)
  const out = { result: r?.result ?? null, maxLevel: r?.maxLevel, msgs: (r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message })), before, after, file: OFB }
  filewrite(out, '07-loadFrom-file')
  console.log('[07] file-load result', out.result, 'max', out.maxLevel, '| geo', JSON.stringify(before), '->', JSON.stringify(after), '| msgs', JSON.stringify(out.msgs))
  return out
}
