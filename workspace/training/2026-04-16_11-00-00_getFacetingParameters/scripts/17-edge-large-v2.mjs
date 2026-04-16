// Test: large and tiny values — BOTH params always provided
export default async function (api, { filewrite }) {
  // Very large chordHeightTol
  const r1 = await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 1000 })
  console.log('[17] large chordHeightTol — maxLevel:', r1.maxLevel)
  const after1 = (await api.v1.common.getFacetingParameters()).result
  console.log('[17] after large chordHeightTol:', JSON.stringify(after1))

  // Very large angleTol
  const r2 = await api.v1.common.setFacetingParameters({ angleTol: 360, chordHeightTol: 0.1 })
  console.log('[17] large angleTol — maxLevel:', r2.maxLevel)
  const after2 = (await api.v1.common.getFacetingParameters()).result
  console.log('[17] after large angleTol:', JSON.stringify(after2))

  // Very small chordHeightTol
  const r3 = await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.001 })
  console.log('[17] tiny chordHeightTol — maxLevel:', r3.maxLevel)
  const after3 = (await api.v1.common.getFacetingParameters()).result
  console.log('[17] after tiny chordHeightTol:', JSON.stringify(after3))

  // Fractional angleTol
  const r4 = await api.v1.common.setFacetingParameters({ angleTol: 0.5, chordHeightTol: 0.1 })
  console.log('[17] fractional angleTol — maxLevel:', r4.maxLevel)
  const after4 = (await api.v1.common.getFacetingParameters()).result
  console.log('[17] after fractional angleTol:', JSON.stringify(after4))

  filewrite({ after1, after2, after3, after4 }, 'edge-large-v2')
  return { after1, after2, after3, after4 }
}
