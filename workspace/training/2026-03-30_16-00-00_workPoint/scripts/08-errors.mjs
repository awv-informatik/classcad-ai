// Test: error cases + name duplicates + built-in check + expression position
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Missing id
  const r1 = await api.v1.part.workPoint({})
  console.log('[08] no id:', r1.result, r1.maxLevel, JSON.stringify(r1.messages))

  // Invalid type
  const r2 = await api.v1.part.workPoint({ id: partId, type: 'INVALID' })
  console.log('[08] bad type:', r2.result, r2.maxLevel, JSON.stringify(r2.messages))

  // Referenced type without refs
  const r3 = await api.v1.part.workPoint({ id: partId, type: 'BREPVERTEX' })
  console.log('[08] no refs:', r3.result, r3.maxLevel, JSON.stringify(r3.messages))

  // Expression in position
  const r4 = await api.v1.part.workPoint({ id: partId, name: 'WP_expr', position: ['10+20', '0', '0'] })
  console.log('[08] expr pos:', r4.result, r4.maxLevel)

  // Duplicate names
  const r5 = await api.v1.part.workPoint({ id: partId, name: 'Dup' })
  const r6 = await api.v1.part.workPoint({ id: partId, name: 'Dup' })
  console.log('[08] dup1:', r5.result, 'dup2:', r6.result)
  const found = await api.v1.part.getWorkGeometry({ id: partId, name: 'Dup' })
  console.log('[08] find Dup:', found.result)

  // Built-in work points
  const names = ['WorkPoint', 'Point', 'Origin', 'Center']
  for (const name of names) {
    const r = await api.v1.part.getWorkGeometry({ id: partId, name })
    if (r.result) console.log('[08] built-in:', name, '=', r.result)
  }

  filewrite({
    noId: { maxLevel: r1.maxLevel, messages: r1.messages },
    badType: { maxLevel: r2.maxLevel, messages: r2.messages },
    noRefs: { maxLevel: r3.maxLevel, messages: r3.messages },
    exprPos: { result: r4.result, maxLevel: r4.maxLevel },
    dups: { first: r5.result, second: r6.result, found: found.result }
  }, 'errors-and-edges')

  return { partId }
}
