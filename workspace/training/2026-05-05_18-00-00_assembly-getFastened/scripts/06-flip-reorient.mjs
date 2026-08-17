export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'P' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'M', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId,
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create with non-default flip and reorient
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'FlipTest',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs, flip: '-Z', reorient: '90' },
    xOffset: 60,
  })).result
  console.log('[06] created with flip=-Z, reorient=90, id:', fId)

  const r = await api.v1.assembly.getFastened({ id: asmId, name: 'FlipTest' })
  console.log('[06] mate1.flip:', r.result?.mate1?.flip)
  console.log('[06] mate1.reorient:', r.result?.mate1?.reorient)
  console.log('[06] mate2.flip:', r.result?.mate2?.flip)
  console.log('[06] mate2.reorient:', r.result?.mate2?.reorient)
  filewrite(r.result, 'flip-reorient-result')

  // Create with default flip/reorient (verify they still appear as Z/0)
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId,
    transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const fId2 = (await api.v1.assembly.fastened({
    id: asmId, name: 'DefaultFlip',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst3], csys: wcs },
    yOffset: 60,
  })).result

  const r2 = await api.v1.assembly.getFastened({ id: asmId, name: 'DefaultFlip' })
  console.log('[06] default mate1.flip:', r2.result?.mate1?.flip)
  console.log('[06] default mate1.reorient:', r2.result?.mate1?.reorient)
  console.log('[06] default mate2.flip:', r2.result?.mate2?.flip)
  console.log('[06] default mate2.reorient:', r2.result?.mate2?.reorient)

  return { asmId }
}
