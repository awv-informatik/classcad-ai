export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_RotCenter' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Bar' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 60, width: 10, height: 10 })
  // WCS at center of box
  const wcs_center = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS_Center', origin: [30, 5, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  // WCS at corner of box
  const wcs_corner = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS_Corner', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test: 45° Z rotation with WCS at center
  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'RotCenter' })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_center', mate1: { path: [inst1], csys: wcs_center },
    zRotation: Math.PI / 4,
  })

  // Test: 45° Z rotation with WCS at corner
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'RotCorner' })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_corner', mate1: { path: [inst2], csys: wcs_corner },
    zRotation: Math.PI / 4, yOffset: 80,
  })

  // No rotation reference
  const inst3 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'NoRot' })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_norot', mate1: { path: [inst3], csys: wcs_corner },
    yOffset: -40,
  })

  const mp1 = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const mp2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  const mp3 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result

  console.log('[16] center-rot CoG:', JSON.stringify(mp1.cog))
  console.log('[16] corner-rot CoG:', JSON.stringify(mp2.cog))
  console.log('[16] no-rot CoG:', JSON.stringify(mp3.cog))

  filewrite({ center: mp1, corner: mp2, noRot: mp3 }, 'rotation-center-mp')

  await snapshot('rotation-centers')

  return { asmId }
}
