export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PlanarGet' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref', origin: [15, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

  // Create a planar with all params
  const cId = (await api.v1.assembly.planar({
    id: asmId,
    name: 'TestPlanar',
    mate1: { path: [inst1], csys: wcs1, flip: '-Z', reorient: '90' },
    mate2: { path: [inst2], csys: wcs2, flip: 'X', reorient: '180' },
    zOffset: 15,
    xOffsetLimits: { min: -10, max: 50 },
    yOffsetLimits: { min: -5, max: 25 },
    zRotationLimits: { min: '-45deg', max: '135deg' },
  })).result

  console.log('[05] created planar cId:', cId)

  // Get it back
  const r = await api.v1.assembly.getPlanar({ id: asmId, name: 'TestPlanar' })
  console.log('[05] getPlanar result keys:', Object.keys(r.result))
  console.log('[05] getPlanar maxLevel:', r.maxLevel)
  filewrite(r.result, 'getPlanar-result')

  // Not found
  const rMissing = await api.v1.assembly.getPlanar({ id: asmId, name: 'NonExistent' })
  console.log('[05] getPlanar not found:', rMissing.result, 'maxLevel:', rMissing.maxLevel)
  filewrite({ result: rMissing.result, messages: rMissing.messages, maxLevel: rMissing.maxLevel }, 'getPlanar-notfound')

  await snapshot('getPlanar')
  return { cId }
}
