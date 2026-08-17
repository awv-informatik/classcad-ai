/**
 * 05 — circularPattern `merged` flag, re-probed (rainer: merge makes the
 * subtraction independent of the instance count; skill claimed "broken").
 *  a) merged, DISJOINT copies (the 2026-04-20 fixture)
 *  b) merged, OVERLAPPING copies
 *  c) THE acid test: blank − merged pattern (count/angle @expr) → update count
 *     → does the subtraction follow the new instance count?
 */
export default async function (api, { snapshot, filewrite }) {
  const out = {}
  const vol = async (partId) => (await api.v1.part.calculateMassProperties({ id: partId })).result?.volume ?? null

  // a) disjoint copies (old fixture: box r=30, 4×90°)
  {
    const partId = (await api.v1.part.create({ name: 'MergeDisjoint' })).result
    const box = (await api.v1.part.box({ id: partId, name: 'B', length: 40, width: 20, height: 25, xPosition: 30, yPosition: -10, zPosition: 0 })).result
    const ax = (await api.v1.part.workAxis({ id: partId, name: 'Z', origin: [0, 0, 0], direction: [0, 0, 1] })).result
    const r = await api.v1.part.circularPattern({ id: partId, name: 'CP', targets: [box], references: [ax], angle: Math.PI / 2, count: 4, merged: 1 })
    out.disjoint = { result: r.result, maxLevel: r.maxLevel, msgs: (r.messages ?? []).map((m) => m.message), vol: await vol(partId) }
    console.log('[05a] merged disjoint:', JSON.stringify(out.disjoint))
  }
  await api.v1.common.clear({})
  // b) overlapping copies (box near center, 6×30° → heavy overlap)
  {
    const partId = (await api.v1.part.create({ name: 'MergeOverlap' })).result
    const box = (await api.v1.part.box({ id: partId, name: 'B', length: 50, width: 16, height: 10, xPosition: 5, yPosition: -8, zPosition: 0 })).result
    const ax = (await api.v1.part.workAxis({ id: partId, name: 'Z', origin: [0, 0, 0], direction: [0, 0, 1] })).result
    const r = await api.v1.part.circularPattern({ id: partId, name: 'CP', targets: [box], references: [ax], angle: Math.PI / 6, count: 6, merged: 1 })
    out.overlap = { result: r.result, maxLevel: r.maxLevel, msgs: (r.messages ?? []).map((m) => m.message), vol: await vol(partId) }
    console.log('[05b] merged overlapping:', JSON.stringify(out.overlap))
    await snapshot('merged-overlap')
  }
  await api.v1.common.clear({})
  // c) acid: disk blank − merged pattern of teeth-like notch tools, count @expr
  {
    const partId = (await api.v1.part.create({ name: 'MergeRegen' })).result
    await api.v1.part.expression({ id: partId, toCreate: [{ name: 'n', value: 6 }, { name: 'ang', value: '2*C:PI/n' }] })
    const blank = (await api.v1.part.cylinder({ id: partId, name: 'Blank', diameter: 100, height: 10 })).result
    const notch = (await api.v1.part.box({ id: partId, name: 'Notch', length: 15, width: 8, height: 14, xPosition: 42, yPosition: -4, zPosition: -2 })).result
    const ax = (await api.v1.part.workAxis({ id: partId, name: 'Z', origin: [0, 0, 0], direction: [0, 0, 1] })).result
    const pat = await api.v1.part.circularPattern({ id: partId, name: 'CP', targets: [notch], references: [ax], angle: '@expr.ang', count: '@expr.n', merged: 1 })
    console.log('[05c] merged pattern:', pat.result, 'maxLevel', pat.maxLevel, JSON.stringify((pat.messages ?? []).map((m) => m.message)))
    const b = await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', name: 'Cut', target: blank, tools: [pat.result] })
    await api.v1.common.recalc({})
    const v6 = await vol(partId)
    const up = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'n', value: 9 }] })
    await api.v1.common.recalc({})
    const v9 = await vol(partId)
    // notch cut volume within the disk ≈ 8×14→clipped… measure relative change instead:
    out.regen = {
      patLevel: pat.maxLevel, boolLevel: b.maxLevel,
      vol6: v6, vol9: v9,
      cutMore: v9 !== null && v6 !== null && v9 < v6 - 100,
      updLevel: up.maxLevel,
    }
    console.log('[05c] count 6→9 regen:', JSON.stringify(out.regen))
    await snapshot('regen-9')
  }
  filewrite(out, 'merged-probe')
  return out
}
