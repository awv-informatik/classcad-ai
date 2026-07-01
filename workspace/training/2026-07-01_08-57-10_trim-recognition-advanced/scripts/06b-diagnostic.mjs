// 06b — no trimming. Dump every segment's kind/mid and both classifier decisions to find why case 06 empties out.
import { makeSketch, circle, line, positions } from './_setup.mjs'
import { segGeom, inAny, boundaryDecision, UNION_OUTLINE } from './_geo.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const C1 = await circle(api, skId, [0, 0, 0], 50)
  const C2 = await circle(api, skId, [60, 0, 0], 50)
  const L = await line(api, skId, [-90, 0, 0], [150, 0, 0])
  const shapes = [{ kind: 'circle', c: [0, 0], r: 50 }, { kind: 'circle', c: [60, 0], r: 50 }]
  console.log('[06b] ids: C1', C1, 'C2', C2, 'L', L)

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const tree = pre.structure?.tree
  console.log('[06b] preTrim per source:', JSON.stringify(pre.result.map(e => ({ src: e.sourceId, segs: e.splittedCurves.length }))))

  const rows = []
  for (const entry of pre.result) {
    for (const seg of entry.splittedCurves) {
      const g = await segGeom(api, seg, tree)
      const naiveInside = inAny(shapes, g.mid)
      const bnd = boundaryDecision(g.mid, g.normal, shapes, UNION_OUTLINE, 0.3)
      rows.push({ id: seg.id, src: entry.sourceId, kind: g.kind, mid: g.mid.map(x => +x.toFixed(1)), naiveTrim: naiveInside, bndKeep: bnd.keep, in1: bnd.in1, in2: bnd.in2 })
    }
  }
  filewrite(rows, '06b-rows')
  for (const r of rows) console.log(`[06b] seg ${r.id} src ${r.src} ${r.kind} mid ${JSON.stringify(r.mid)} | naiveTrim ${r.naiveTrim} | bnd in1=${r.in1} in2=${r.in2} keep=${r.bndKeep}`)
  console.log('[06b] naive would KEEP:', rows.filter(r => !r.naiveTrim).map(r => r.id))
  console.log('[06b] boundary would KEEP:', rows.filter(r => r.bndKeep).map(r => r.id))
  return { n: rows.length }
}
