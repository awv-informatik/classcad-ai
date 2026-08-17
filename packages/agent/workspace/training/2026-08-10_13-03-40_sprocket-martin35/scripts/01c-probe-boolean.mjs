/**
 * 01c — probe part.boolean semantics with many tools + circularPattern:
 * 1. box − [cylA, cylB] (two plain tools)
 * 2. box − [cylC, patternOf(cylC)] (tool + its pattern)
 * Uses common.clear between cases (part.create works once per cleared drawing).
 */
export default async function (api, { filewrite }) {
  const out = {}

  // case 1: two plain tools
  {
    const partId = (await api.v1.part.create({ name: 'Bool1' })).result
    const box = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 80, height: 10 })).result
    const cA = (await api.v1.part.cylinder({ id: partId, name: 'CylA', diameter: 10, height: 40 })).result
    const wcs = (await api.v1.part.workCSys({ id: partId, name: 'W1', offset: [30, 30, -5], rotation: [0, 0, 0] })).result
    const cB = (await api.v1.part.cylinder({ id: partId, name: 'CylB', references: [wcs], diameter: 10, height: 40 })).result
    const b = await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: box, tools: [cA, cB] })
    out.case1 = { result: b.result, maxLevel: b.maxLevel, messages: b.messages }
    console.log('[01c] case1 (2 plain tools):', b.result, 'maxLevel', b.maxLevel, JSON.stringify(b.messages ?? []))
  }

  await api.v1.common.clear({})

  // case 2: tool + pattern of the tool
  {
    const partId = (await api.v1.part.create({ name: 'Bool2' })).result
    const box = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 80, height: 10, translation: [-40, -40, 0] })).result
    const wcs = (await api.v1.part.workCSys({ id: partId, name: 'W2', offset: [25, 0, -5], rotation: [0, 0, 0] })).result
    const cC = (await api.v1.part.cylinder({ id: partId, name: 'CylC', references: [wcs], diameter: 8, height: 40 })).result
    const zax = Object.values((await api.v1.part.workAxis({ id: partId, name: 'AxZ', origin: [0, 0, 0], direction: [0, 0, 1] }))).length
      ? (await api.v1.part.workAxis({ id: partId, name: 'AxZ2', origin: [0, 0, 0], direction: [0, 0, 1] })).result
      : null
    const pat = await api.v1.part.circularPattern({
      id: partId, name: 'Pat', targets: [cC], references: [zax], angle: (2 * Math.PI) / 6, count: 6,
    })
    console.log('[01c] pattern:', pat.result, 'maxLevel', pat.maxLevel)
    const b = await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: box, tools: [cC, pat.result] })
    out.case2 = { result: b.result, maxLevel: b.maxLevel, messages: b.messages }
    console.log('[01c] case2 (tool + its pattern):', b.result, 'maxLevel', b.maxLevel, JSON.stringify(b.messages ?? []))
    if (b.maxLevel > 31) {
      // variant: tools = [pattern only]
      const b2 = await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: box, tools: [pat.result] })
      out.case2b = { result: b2.result, maxLevel: b2.maxLevel, messages: b2.messages }
      console.log('[01c] case2b (pattern only):', b2.result, 'maxLevel', b2.maxLevel, JSON.stringify(b2.messages ?? []))
    }
  }

  filewrite(out, 'boolean-probe')
  return out
}
