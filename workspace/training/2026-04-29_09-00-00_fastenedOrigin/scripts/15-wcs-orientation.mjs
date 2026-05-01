export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_WCSOrient' })).result

  // Template with a non-default WCS orientation (rotated 45° around Z)
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 50, width: 20, height: 15 })

  // WCS1: identity orientation at origin
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS_Identity', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // WCS2: rotated 45° around Z-axis
  const cos45 = Math.cos(Math.PI / 4)
  const sin45 = Math.sin(Math.PI / 4)
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS_Rot45Z', origin: [25, 10, 0],
    xDirection: [cos45, sin45, 0], yDirection: [-sin45, cos45, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Inst1: fastenedOrigin with identity WCS
  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Identity' })).result
  const fo1 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_identity', mate1: { path: [inst1], csys: wcs1 },
  })
  console.log('[15] identity WCS:', fo1.result, 'maxLevel:', fo1.maxLevel)

  // Inst2: fastenedOrigin with rotated WCS — instance should be rotated to align WCS with global
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Rot45' })).result
  const fo2 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_rot45', mate1: { path: [inst2], csys: wcs2 }, yOffset: 60,
  })
  console.log('[15] rotated WCS:', fo2.result, 'maxLevel:', fo2.maxLevel)

  filewrite({
    identity: { result: fo1.result, maxLevel: fo1.maxLevel },
    rotated: { result: fo2.result, maxLevel: fo2.maxLevel },
  }, 'wcs-orient-results')

  await snapshot('wcs-orientation')

  return { asmId }
}
