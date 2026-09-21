// 12 — a body that KEEPS its enclosed void: do chamfer, union, slice through the void and STEP export still work?
import { call, volume, boxAt, fmt } from './_setup.mjs'
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VoidThenFeatures' })).result
  const outer = await boxAt(api, partId, 'Outer', [100, 60, 40], [0, 0, 0])
  const inner = await boxAt(api, partId, 'Inner', [80, 40, 20], [10, 10, 10])
  let body = (await call(api.v1.part.boolean({ id: partId, name: 'Hollow', type: 'SUBTRACTION', target: outer, tools: [inner] }))).id
  const out = { hollow: await volume(api, partId), expectHollow: 176000 }
  const edge = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [50, 0, 40] }] })).result.lines
  const ch = await call(api.v1.part.chamfer({ id: partId, name: 'TopEdge', references: edge, distance1: 4 }))
  out.chamfer = ch; out.afterChamfer = await volume(api, partId); out.expectAfterChamfer = 176000 - 0.5 * 4 * 4 * 100
  const boss = await boxAt(api, partId, 'Boss', [20, 20, 10], [40, 20, 38])
  const un = await call(api.v1.part.boolean({ id: partId, name: 'AddBoss', type: 'UNION', target: ch.id, tools: [boss] }))
  out.union = un; out.afterUnion = await volume(api, partId); out.expectAfterUnion = out.expectAfterChamfer + 20 * 20 * 8
  const wp = (await api.v1.part.workPlane({ id: partId, name: 'Mid', position: [50, 0, 0], normal: [1, 0, 0] })).result
  const sl = await call(api.v1.part.slice({ id: partId, name: 'HalfThroughVoid', targets: [un.id], reference: wp, inverted: 1 }))
  out.slice = sl; out.afterSlice = await volume(api, partId); out.expectAfterSlice = out.expectAfterUnion / 2
  await snapshot('sliced-through-void')
  console.log('[12]', JSON.stringify(out, (k, v) => fmt(v)))
  filewrite(out, 'result')
  return { partId }
}
