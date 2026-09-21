// 01 — simplest case: 100x60x40 box minus a fully enclosed 80x40x20 box.
// If the claim is right: volume stays 240000 and later features break.
// If it is wrong: volume = 240000 - 64000 = 176000 and later features work.
import { call, volume, boxAt, cylAt, fmt } from './_setup.mjs'
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EnclosedBox' })).result
  const outer = await boxAt(api, partId, 'Outer', [100, 60, 40], [0, 0, 0])
  const inner = await boxAt(api, partId, 'Inner', [80, 40, 20], [10, 10, 10])
  const out = { expectHollow: 176000 }
  out.before = await volume(api, partId) // two bodies: 240000 + 64000
  const sub = await call(api.v1.part.boolean({ id: partId, name: 'Hollow', type: 'SUBTRACTION', target: outer, tools: [inner] }))
  out.sub = sub
  out.afterHollow = await volume(api, partId)
  await snapshot('hollow-section', { section: { origin: [50, 30, 20], normal: [0, 1, 0] } })
  // later feature 1: bore through the top wall into the void (opens it)
  const bore = await cylAt(api, partId, 'Bore', 10, 30, [50, 30, 25])
  const cut = await call(api.v1.part.boolean({ id: partId, name: 'OpenVoid', type: 'SUBTRACTION', target: sub.id, tools: [bore] }))
  out.cut = cut
  out.afterBore = await volume(api, partId)
  out.expectAfterBore = 176000 - Math.PI * 25 * 10
  await snapshot('bored-section', { section: { origin: [50, 30, 20], normal: [0, 1, 0] } })
  console.log('[01]', JSON.stringify(out, (k, v) => fmt(v)))
  filewrite(out, 'result')
  return { partId }
}
