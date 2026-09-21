/** Shared probes. Errors are data here, so nothing throws: every call returns { id, maxLevel, msg }. */
export const call = async (p) => {
  try {
    const r = await p
    return { id: r.result, maxLevel: r.maxLevel, msg: (r.messages || []).filter((m) => m.level >= 41).map((m) => m.message).join(' | ').slice(0, 220) }
  } catch (e) {
    return { id: null, maxLevel: 99, msg: String(e.message).slice(0, 220) }
  }
}
export const volume = async (api, partId) => {
  const r = await call(api.v1.part.calculateMassProperties({ id: partId }))
  return r.id?.volume ?? 'ERR ' + r.msg
}
/** Primitive box with its min corner at `at`. */
export const boxAt = async (api, partId, name, [l, w, h], at) => {
  const cs = (await api.v1.part.workCSys({ id: partId, name: name + '_cs', offset: at })).result
  return (await api.v1.part.box({ id: partId, name, length: l, width: w, height: h, references: [cs] })).result
}
export const cylAt = async (api, partId, name, d, h, at, rotation = [0, 0, 0]) => {
  const cs = (await api.v1.part.workCSys({ id: partId, name: name + '_cs', offset: at, rotation })).result
  return (await api.v1.part.cylinder({ id: partId, name, diameter: d, height: h, references: [cs] })).result
}
export const fmt = (v) => (typeof v === 'number' ? v.toFixed(3) : v)
