export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'UCTTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [30, 20, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box', length: 20, width: 20, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [10, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create inst1 at origin
  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result

  // Create inst2 at a specific position (offset via transformation)
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'BlockInst',
    transformation: [[50, 30, 25], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before-uct')

  // useCurrentTransform = TRUE: should calculate offsets/rotations from
  // current positions rather than using explicit offset values
  const r = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_UCT',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    useCurrentTransform: true,
  })
  console.log('[05] UCT result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'uct-response')

  await snapshot('after-uct')

  // Now read back the constraint to see what offsets were computed
  const getFr = await api.v1.assembly.getFastened({ id: asmId, name: 'F_UCT' })
  console.log('[05] getFastened result:', JSON.stringify(getFr.result))
  filewrite(getFr.result, 'uct-getFastened')

  return { asmId }
}
