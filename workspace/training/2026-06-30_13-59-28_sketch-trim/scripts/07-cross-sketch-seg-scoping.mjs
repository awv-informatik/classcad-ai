// 07 — does trim scope curveIds to THIS sketch's staging? Pass a sk2 segment id to trim on sk1.
import { makeSketch, addSketch, line, positions, firstError } from './_setup.mjs'

const lastCode = r => { const e = firstError(r); return e[e.length - 1]?.code }

export default async function (api, { filewrite }) {
  const { partId, skId: sk1, planeId } = await makeSketch(api)
  await line(api, sk1, [0, 50, 0], [100, 50, 0]); await line(api, sk1, [50, 0, 0], [50, 100, 0])
  const pre1 = await api.v1.sketch.preTrim({ id: sk1 })
  const sk1Witness = pre1.result[0].splittedCurves[0].id

  const sk2 = await addSketch(api, partId, planeId, 'sk2')
  await line(api, sk2, [0, 50, 0], [100, 50, 0]); await line(api, sk2, [50, 0, 0], [50, 100, 0])
  const pre2 = await api.v1.sketch.preTrim({ id: sk2 })
  const segFromSk2 = pre2.result[0].splittedCurves[0].id

  // both stagings should be alive (different sketches)
  const sk1WitnessAliveBefore = (await positions(api, sk1Witness)).maxLevel
  const seg2AliveBefore = (await positions(api, segFromSk2)).maxLevel
  console.log('[07] sk1Witness', sk1Witness, 'alive', sk1WitnessAliveBefore, '| segFromSk2', segFromSk2, 'alive', seg2AliveBefore)

  // THE PROBE: trim sk1 with a segment that belongs to sk2
  const r = await api.v1.sketch.trim({ id: sk1, curveIds: [segFromSk2] })
  const seg2AfterMax = (await positions(api, segFromSk2)).maxLevel
  const sk1WitnessAfterMax = (await positions(api, sk1Witness)).maxLevel
  filewrite({ code: lastCode(r), max: r.maxLevel, err: firstError(r), seg2AliveBefore, seg2AfterMax, sk1WitnessAliveBefore, sk1WitnessAfterMax }, '07-cross-sketch')
  console.log('[07] trim(sk1,[seg_from_sk2]) max', r.maxLevel, 'code', lastCode(r))
  console.log('[07] seg_from_sk2 trimmed in sk2? (mL51 after)', seg2AfterMax >= 51, '| sk1 witness untouched?', sk1WitnessAfterMax <= 31)

  const verdict = r.maxLevel >= 51 ? `rejected (${lastCode(r)}) — scoped/typed` : (seg2AfterMax >= 51 ? 'LENIENT — trimmed sk2 segment (global, footgun #154-like)' : 'silent no-op')
  console.log('[07] VERDICT:', verdict)
  return { code: lastCode(r), max: r.maxLevel, leniently_trimmed_sk2: seg2AfterMax >= 51, verdict }
}
