// 05b — isolate the call-B failure from 05. Capture messages for several permutations.
// Each case rebuilds a fresh sketch (part.create clears the drawing).
import { makeSketch, line, firstError } from './_setup.mjs'

async function run(api, label, buildSplits) {
  const { skId } = await makeSketch(api, { name: 'Ord_' + label })
  const H = await line(api, skId, [0, 0, 0], [100, 0, 0])   // horizontal
  const V = await line(api, skId, [0, 10, 0], [0, 60, 0])   // vertical
  const H2 = await line(api, skId, [0, -20, 0], [100, -20, 0]) // 2nd horizontal (parallel, no intersection)
  const splits = buildSplits({ H, V, H2 })
  const r = await api.v1.sketch.splitCurve({ id: skId, splits })
  const ok = Array.isArray(r.result)
  console.log(`[05b] ${label}: maxLevel=${r.maxLevel} isArray=${ok}` +
    (ok ? ` entries=${r.result.length} segs=${JSON.stringify(r.result.map(e => e.splittedCurves.length))}` : ` ERR=${JSON.stringify(firstError(r))}`))
  return { label, maxLevel: r.maxLevel, isArray: ok, result: r.result, messages: r.messages }
}

export default async function (api, { filewrite }) {
  const out = []
  // 1) horizontal(1) then vertical(2) — the passing order from 05 call A
  out.push(await run(api, 'H1_V2', ({ H, V }) => [{ geomId: H, values: [0.5] }, { geomId: V, values: [0.25, 0.75] }]))
  // 2) vertical(2) then horizontal(1) — the FAILING order from 05 call B
  out.push(await run(api, 'V2_H1', ({ H, V }) => [{ geomId: V, values: [0.25, 0.75] }, { geomId: H, values: [0.5] }]))
  // 3) vertical(2) alone — does the vertical-with-2-values fail by itself?
  out.push(await run(api, 'V2_alone', ({ V }) => [{ geomId: V, values: [0.25, 0.75] }]))
  // 4) horizontal(1) alone
  out.push(await run(api, 'H1_alone', ({ H }) => [{ geomId: H, values: [0.5] }]))
  // 5) two PARALLEL horizontals, 2-values first then 1-value — rules out vertical-orientation
  out.push(await run(api, 'H2vals_H1val', ({ H, H2 }) => [{ geomId: H2, values: [0.25, 0.75] }, { geomId: H, values: [0.5] }]))
  // 6) two PARALLEL horizontals, 1-value first then 2-values
  out.push(await run(api, 'H1val_H2vals', ({ H, H2 }) => [{ geomId: H, values: [0.5] }, { geomId: H2, values: [0.25, 0.75] }]))
  // 7) same as failing but values pre-sorted identical counts: V(1) then H(1)
  out.push(await run(api, 'V1_H1', ({ H, V }) => [{ geomId: V, values: [0.5] }, { geomId: H, values: [0.5] }]))
  filewrite(out, '05b-permutations')
  return { summary: out.map(o => ({ label: o.label, maxLevel: o.maxLevel, isArray: o.isArray })) }
}
