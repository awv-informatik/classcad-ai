// Q (corrected): workCSys takes offset+rotation (NOT origin/xDirection/yDirection — cylinder.md
// example is wrong). Does the cylinder follow csys rotation, and does offset apply pre- or
// post-rotation? Ry(+90°) maps csys-z to world +X.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Probe2' })).result

  const wcsR = await api.v1.part.workCSys({
    id: partId, name: 'WCS_X',
    offset: [30, 40, 20],
    rotation: [0, Math.PI / 2, 0],
  })
  console.log('[02] wcs:', wcsR.result, 'maxLevel:', wcsR.maxLevel, JSON.stringify(wcsR.messages ?? []))

  const cylR = await api.v1.part.cylinder({
    id: partId, name: 'CylX', references: [wcsR.result], diameter: 12, height: 50,
  })
  console.log('[02] cyl:', cylR.result, 'maxLevel:', cylR.maxLevel)

  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log('[02] COG:', JSON.stringify(mp.cog), 'vol:', mp.volume.toFixed(2))

  const near = (a, b) => Math.abs(a - b) < 0.1
  let verdict = 'UNCLEAR'
  if (near(mp.cog.x, 55) && near(mp.cog.y, 40) && near(mp.cog.z, 20)) verdict = 'ROTATED, offset in world coords (base 30,40,20 axis +X)'
  else if (near(mp.cog.x, 45) && near(mp.cog.y, 40) && near(mp.cog.z, -30)) verdict = 'ROTATED, offset applied in rotated frame'
  else if (near(mp.cog.x, 30) && near(mp.cog.y, 40) && near(mp.cog.z, 45)) verdict = 'offset only, NO rotation followed'
  console.log('[02] verdict:', verdict)

  filewrite({ cog: mp.cog, volume: mp.volume, verdict }, 'probe2')
  await snapshot('02-csys-cyl')
  return { partId, verdict }
}
