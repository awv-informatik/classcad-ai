export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Bracket' })).result

  // Create a bracket shape: box + cylinder boss, mirrored for symmetry
  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [10, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const baseBox = (await api.v1.part.box({
    id: partId, name: 'Base', length: 60, width: 40, height: 10, references: [wcs],
  })).result

  // Add a boss on one side
  const wcs2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS2',
    origin: [30, 10, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const bossBox = (await api.v1.part.box({
    id: partId, name: 'Boss', length: 15, width: 20, height: 25, references: [wcs2],
  })).result

  console.log('[12] baseBox:', baseBox, 'bossBox:', bossBox)

  await snapshot('before-mirror')

  // Mirror the boss across the Right (YZ) plane to get symmetric bosses
  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result

  const mirrorId = (await api.v1.part.mirror({
    id: partId, name: 'MirrorBoss',
    targets: [bossBox],
    references: [rightWp],
  })).result
  console.log('[12] mirrorId:', mirrorId)

  await snapshot('after-mirror')

  // Now add a fillet to the original boss and see if it propagates to mirror
  await api.v1.common.recalc({})

  // Get an edge on the top of the boss
  const edges = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [45, 10, 35] }],
  })).result
  console.log('[12] boss edge IDs:', JSON.stringify(edges))

  if (edges?.lines?.length) {
    const filletId = (await api.v1.part.fillet({
      id: partId, name: 'FilletBoss',
      references: edges.lines,
      radius: 3,
    })).result
    console.log('[12] filletId:', filletId)

    await snapshot('after-fillet')
  } else {
    console.log('[12] no edge found for fillet')
  }

  return { partId, baseBox, bossBox, mirrorId }
}
