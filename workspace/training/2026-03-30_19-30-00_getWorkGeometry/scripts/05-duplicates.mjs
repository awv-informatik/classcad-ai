// Test getWorkGeometry with duplicate names
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GWGTest' })).result

  // Create two work planes with the same name
  const wp1 = (await api.v1.part.workPlane({ id: partId, name: 'DuplicateName', origin: [0, 0, 0], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  const wp2 = (await api.v1.part.workPlane({ id: partId, name: 'DuplicateName', origin: [0, 0, 100], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  console.log('[05] wp1:', wp1, 'wp2:', wp2)

  // Which one does getWorkGeometry return?
  const r = await api.v1.part.getWorkGeometry({ id: partId, name: 'DuplicateName' })
  console.log('[05] getWorkGeometry DuplicateName → result:', r.result, 'matches wp1:', r.result === wp1, 'matches wp2:', r.result === wp2)

  // Also test duplicate across types — a work plane and work axis with same name
  const wp3 = (await api.v1.part.workPlane({ id: partId, name: 'CrossType', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  const wa1 = (await api.v1.part.workAxis({ id: partId, name: 'CrossType', position: [0, 0, 0], direction: [0, 1, 0] })).result
  console.log('[05] crossType plane:', wp3, 'axis:', wa1)

  const r2 = await api.v1.part.getWorkGeometry({ id: partId, name: 'CrossType' })
  console.log('[05] getWorkGeometry CrossType → result:', r2.result, 'matches plane:', r2.result === wp3, 'matches axis:', r2.result === wa1)

  filewrite({
    sameType: { wp1, wp2, returned: r.result, matchesFirst: r.result === wp1, matchesSecond: r.result === wp2 },
    crossType: { plane: wp3, axis: wa1, returned: r2.result, matchesPlane: r2.result === wp3, matchesAxis: r2.result === wa1 }
  }, 'duplicates')

  return { partId }
}
