// NEW test: successive calls — does the second overwrite or compound?
export default async function (api, { filewrite }) {
  // Reset
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.1 })

  // Call 1: set specific values
  await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0.5 })
  const after1 = (await api.v1.common.getFacetingParameters()).result

  // Call 2: set different values — should overwrite, not compound
  await api.v1.common.setFacetingParameters({ angleTol: 5, chordHeightTol: 0.02 })
  const after2 = (await api.v1.common.getFacetingParameters()).result

  console.log('[05] after call 1:', JSON.stringify(after1))
  console.log('[05] after call 2:', JSON.stringify(after2))
  console.log('[05] overwrite confirmed:', after2.angleTol === 5 && after2.chordHeightTol === 0.02)

  filewrite({ after1, after2, overwriteConfirmed: after2.angleTol === 5 && after2.chordHeightTol === 0.02 }, 'successive-calls')
  return {}
}
