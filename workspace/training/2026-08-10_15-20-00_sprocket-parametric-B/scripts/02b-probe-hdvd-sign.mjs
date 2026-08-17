/**
 * 02b — HD/VD point-pair dimension sign/order semantics (undocumented).
 * Fixed point O at origin; free point P seeded at various quadrants;
 * dim [O,P] vs [P,O] with positive value — where does P land?
 */
export default async function (api, { filewrite }) {
  const partR = await api.v1.part.create({ name: 'SignProbe' })
  const partId = partR.result
  const top = Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === 'Top').id
  const out = {}

  const probe = async (label, type, order, seed) => {
    const sk = (await api.v1.sketch.create({ id: partId, planeId: top, name: label })).result
    const o = (await api.v1.sketch.point({ id: sk, pos: [0, 0, 0] })).result
    const p = (await api.v1.sketch.point({ id: sk, pos: [seed[0], seed[1], 0] })).result
    await api.v1.sketch.constraint({ id: sk, type: 'FIXATION', geomIds: [o] })
    const ids = order === 'OP' ? [o, p] : [p, o]
    const d = await api.v1.sketch.dimension({ id: sk, type, geomIds: ids, value: 40 })
    const pos = (await api.v1.sketch.getPositions({ id: p })).result?.pos
    out[label] = { level: d.maxLevel, seed, solved: [pos?.x, pos?.y] }
    console.log(`[02b] ${label}: ${type} [${order}] v=40 seed(${seed}) → (${pos?.x?.toFixed(2)}, ${pos?.y?.toFixed(2)})`)
  }

  await probe('vd-OP-seedUp', 'VERTICAL_DISTANCE', 'OP', [0, 30])
  await probe('vd-OP-seedDown', 'VERTICAL_DISTANCE', 'OP', [0, -30])
  await probe('vd-PO-seedUp', 'VERTICAL_DISTANCE', 'PO', [0, 30])
  await probe('hd-OP-seedRight', 'HORIZONTAL_DISTANCE', 'OP', [30, 0])
  await probe('hd-OP-seedLeft', 'HORIZONTAL_DISTANCE', 'OP', [-30, 0])
  await probe('hd-PO-seedLeft', 'HORIZONTAL_DISTANCE', 'PO', [-30, 0])
  // far-off seed: does a LARGE move keep the seed side? (relevant: perturbed sketch)
  await probe('vd-OP-seedUpFar', 'VERTICAL_DISTANCE', 'OP', [5, 90])

  filewrite(out, 'hdvd-sign')
  return out
}
