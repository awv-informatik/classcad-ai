// 02 — VERIFY the fix + inverse (happy path), all three region ops in one run (post-fix nothing hangs).
//   construction-only extrusion/revolve/twist  -> clean error (maxLevel>=51), NO hang
//   normal      extrusion/revolve/twist        -> builds a solid (result id, maxLevel 31)
import { makeSketch, addSketch } from './_setup.mjs'
import { withTimeout } from './_timeout.mjs'

const classify = async (label, call) => {
  const res = await withTimeout(call, 10000, label)
  if (res.hung) return { label, verdict: 'HUNG' }
  const r = res.r, msgs = (r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message?.slice(0, 90) }))
  const errored = (r?.maxLevel ?? 0) >= 51
  return { label, verdict: errored ? 'ERROR' : 'BUILT', result: r?.result ?? null, maxLevel: r?.maxLevel, msgs: errored ? msgs : undefined }
}

export default async function (api, { filewrite }) {
  const { partId, planeId } = await makeSketch(api, { name: 'Verify' })
  const S = api.v1.sketch
  const rect = async (isC, ox = 0) => (await S.rectangle({ id: await addSketch(api, partId, planeId, 'sk'), startPos: [ox, 0, 0], endPos: [ox + 40, 40, 0], isConstruction: isC })).result
  const out = []

  // extrusion
  out.push(await classify('extrude-construction', api.v1.part.extrusion({ id: partId, references: await rect(true), limit2: 25 })))
  out.push(await classify('extrude-normal', api.v1.part.extrusion({ id: partId, references: await rect(false), limit2: 25 })))

  // revolve (needs an axis line, offset from the profile)
  const revC = await addSketch(api, partId, planeId, 'revC')
  const rcRect = (await S.rectangle({ id: revC, startPos: [0, 0, 0], endPos: [40, 40, 0], isConstruction: true })).result
  const rcAxis = (await S.line({ id: revC, startPos: [-15, 0, 0], endPos: [-15, 40, 0] })).result
  out.push(await classify('revolve-construction', api.v1.part.revolve({ id: partId, references: rcRect, axisIds: [rcAxis] })))
  const revN = await addSketch(api, partId, planeId, 'revN')
  const rnRect = (await S.rectangle({ id: revN, startPos: [0, 0, 0], endPos: [40, 40, 0] })).result
  const rnAxis = (await S.line({ id: revN, startPos: [-15, 0, 0], endPos: [-15, 40, 0] })).result
  out.push(await classify('revolve-normal', api.v1.part.revolve({ id: partId, references: rnRect, axisIds: [rnAxis] })))

  // twist
  out.push(await classify('twist-construction', api.v1.part.twist({ id: partId, references: await rect(true), twistAngle: 1.0, limit2: 60 })))
  out.push(await classify('twist-normal', api.v1.part.twist({ id: partId, references: await rect(false), twistAngle: 1.0, limit2: 60 })))

  filewrite(out, '02-verify')
  for (const o of out) console.log(`[02] ${o.label.padEnd(22)} -> ${o.verdict}${o.verdict === 'ERROR' ? ' max=' + o.maxLevel + ' ' + JSON.stringify(o.msgs) : ''}${o.verdict === 'BUILT' ? ' id=' + o.result : ''}`)
  const ok = out.filter(o => o.label.endsWith('construction')).every(o => o.verdict === 'ERROR') && out.filter(o => o.label.endsWith('normal')).every(o => o.verdict === 'BUILT')
  console.log('[02]', ok ? 'PASS — all construction rejected cleanly, all normal build, no hang' : 'CHECK results')
  return { ok, out }
}
