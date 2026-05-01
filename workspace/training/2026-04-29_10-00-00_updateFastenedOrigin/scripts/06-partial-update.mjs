export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PartialTest' })).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 60, width: 40, height: 25 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  // Create with many params set
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'PartialFO',
    mate1: { path: [inst], csys: wcs, flip: '-X', reorient: '90' },
    xOffset: 10, yOffset: 20, zOffset: 30,
    xRotation: '15deg', yRotation: '25deg', zRotation: '35deg',
  })).result

  const before = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'PartialFO' })).result
  filewrite(before, 'full-initial-state')
  console.log('[06] initial state:')
  console.log('[06]   offsets:', before.xOffset, before.yOffset, before.zOffset)
  console.log('[06]   rotations:', before.xRotation, before.yRotation, before.zRotation)
  console.log('[06]   mate1 flip:', before.mate1.flip, 'reorient:', before.mate1.reorient)

  // Update ONLY xOffset — everything else must be preserved
  await api.v1.assembly.updateFastenedOrigin({ id: foId, xOffset: 99 })
  const after = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'PartialFO' })).result
  filewrite(after, 'after-partial-update')

  console.log('[06] after updating xOffset to 99:')
  console.log('[06]   xOffset:', after.xOffset, '(expect 99)')
  console.log('[06]   yOffset preserved?', after.yOffset === before.yOffset ? '✓' : '❌', after.yOffset)
  console.log('[06]   zOffset preserved?', after.zOffset === before.zOffset ? '✓' : '❌', after.zOffset)
  console.log('[06]   xRotation preserved?', Math.abs(after.xRotation - before.xRotation) < 0.001 ? '✓' : '❌', after.xRotation)
  console.log('[06]   yRotation preserved?', Math.abs(after.yRotation - before.yRotation) < 0.001 ? '✓' : '❌', after.yRotation)
  console.log('[06]   zRotation preserved?', Math.abs(after.zRotation - before.zRotation) < 0.001 ? '✓' : '❌', after.zRotation)
  console.log('[06]   mate1.flip preserved?', after.mate1.flip === before.mate1.flip ? '✓' : '❌', after.mate1.flip)
  console.log('[06]   mate1.reorient preserved?', after.mate1.reorient === before.mate1.reorient ? '✓' : '❌', after.mate1.reorient)
  console.log('[06]   mate1.csys preserved?', after.mate1.csys === before.mate1.csys ? '✓' : '❌', after.mate1.csys)
  console.log('[06]   name preserved?', after.name === before.name ? '✓' : '❌', after.name)

  return { foId }
}
