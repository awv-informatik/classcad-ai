// Verify angleTol boundary: 0 (disabled), 0.99 (rejected), 1.0 (accepted)
export default async function (api, { filewrite }) {
  const tests = [
    { angleTol: 0, chordHeightTol: 0.1, expect: 'ok (disabled)' },
    { angleTol: 0.5, chordHeightTol: 0.1, expect: 'rejected' },
    { angleTol: 0.99, chordHeightTol: 0.1, expect: 'rejected' },
    { angleTol: 1.0, chordHeightTol: 0.1, expect: 'ok (boundary)' },
    { angleTol: 1.5, chordHeightTol: 0.1, expect: 'ok' },
  ]

  const results = []
  for (const t of tests) {
    // Reset
    await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.1 })
    const r = await api.v1.common.setFacetingParameters({ angleTol: t.angleTol, chordHeightTol: t.chordHeightTol })
    const after = (await api.v1.common.getFacetingParameters()).result
    const ok = r.maxLevel <= 31
    results.push({ input: t.angleTol, expected: t.expect, maxLevel: r.maxLevel, ok, after })
    console.log(`[02] angleTol=${t.angleTol}: ${ok ? '✓' : '❌'} (maxLevel=${r.maxLevel}, readback=${after.angleTol})`)
  }

  filewrite(results, 'angleTol-boundary')
  return {}
}
