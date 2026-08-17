// Q: does part.cylinder on an oriented workCSys adopt the CSys ORIENTATION (z along csys-z)
// or only its origin? Decides how the X-axis port bore gets built.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Probe' })).result

  // CSys with z-axis = world +X: x=[0,1,0], y=[0,0,1] → z = x×y = [1,0,0]
  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_X',
    origin: [30, 40, 20],
    xDirection: [0, 1, 0],
    yDirection: [0, 0, 1],
  })).result

  const cyl = (await api.v1.part.cylinder({
    id: partId, name: 'CylX', references: [wcs], diameter: 12, height: 50,
  })).result

  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log('[01] wcs:', wcs, 'cyl:', cyl)
  console.log('[01] COG:', JSON.stringify(mp.cog), 'vol:', mp.volume.toFixed(2), '(expect 5654.87)')

  // axis +X from (30,40,20) → COG (55,40,20). origin-only (axis stays +Z) → COG (30,40,45).
  const followed = Math.abs(mp.cog.x - 55) < 0.1 && Math.abs(mp.cog.z - 20) < 0.1
  const originOnly = Math.abs(mp.cog.x - 30) < 0.1 && Math.abs(mp.cog.z - 45) < 0.1
  console.log('[01] orientation-follows:', followed ? 'YES (axis along csys z = +X)' : originOnly ? 'NO (origin only, axis stays +Z)' : 'UNCLEAR — investigate')

  filewrite({ wcs, cyl, cog: mp.cog, volume: mp.volume, followed, originOnly }, 'probe1')
  await snapshot('01-csys-cyl')
  return { partId, followed, originOnly }
}
