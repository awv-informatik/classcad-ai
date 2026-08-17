// Inverse test: the self-reference guard must NOT break valid distinct booleans.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolValid' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const out = {}

  // 2D union of two distinct overlapping shapes
  const sa = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: sa, centerPos: [0, 0, 0], radius: 30 })
  const sb = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: sb, centerPos: [20, 0, 0], radius: 30 })
  const u2 = await api.v1.curve.union2d({ target: sa, tool: sb })
  out.union2d_distinct = { maxLevel: u2.maxLevel, messages: u2.messages }
  console.log('[inv] union2d distinct:', u2.maxLevel, JSON.stringify(u2.messages))

  // 3D solid union of two distinct overlapping boxes
  const b1 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40 })).result
  const b2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40, translation: [20, 0, 0] })).result
  const su = await api.v1.solid.union({ id: eifId, target: b1, tools: [b2] })
  out.solidUnion_distinct = { maxLevel: su.maxLevel, messages: su.messages }
  console.log('[inv] solid.union distinct:', su.maxLevel, JSON.stringify(su.messages))

  // 3D solid subtraction of two distinct boxes
  const b3 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40 })).result
  const b4 = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 60, translation: [10, 10, -10] })).result
  const ss = await api.v1.solid.subtraction({ id: eifId, target: b3, tools: [b4] })
  out.solidSub_distinct = { maxLevel: ss.maxLevel, messages: ss.messages }
  console.log('[inv] solid.subtraction distinct:', ss.maxLevel, JSON.stringify(ss.messages))

  filewrite(out, 'inverse-results')
  return out
}
