export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Reference at X=100
  const instRef = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Ref',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Ref',
    mate1: { path: [instRef], csys: wcs },
    xOffset: 100,
  })

  // Target at Y=60, reorient='0' (default)
  const instTarget = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Target',
  })).result
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Target',
    mate1: { path: [instTarget], csys: wcs },
    yOffset: 60,
  })).result

  const results = {}

  // reorient '0' (default) — local COG [20,15,10]
  // Target world COG: [20, 75, 10]
  // Combined: [(120+20)/2, (15+75)/2, (10+10)/2] = [70, 45, 10]
  const cog0 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[05] reorient 0:   COG:', JSON.stringify(cog0))
  results.reorient0 = cog0

  // reorient '90' — CW 90° around Z: [x,y,z] → [y, -x, z]
  // [20,15,10] → [15, -20, 10]
  // + yOffset: [15, -20+60, 10] = [15, 40, 10]
  // Combined: [(120+15)/2, (15+40)/2, (10+10)/2] = [67.5, 27.5, 10]
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { reorient: '90' } })
  const cog90 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[05] reorient 90:  COG:', JSON.stringify(cog90))
  results.reorient90 = cog90
  await snapshot('reorient-90', { view: 'top' })

  // reorient '180' — CW 180° around Z: [x,y,z] → [-x, -y, z]
  // [20,15,10] → [-20, -15, 10]
  // + yOffset: [-20, -15+60, 10] = [-20, 45, 10]
  // Combined: [(120-20)/2, (15+45)/2, (10+10)/2] = [50, 30, 10]
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { reorient: '180' } })
  const cog180 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[05] reorient 180: COG:', JSON.stringify(cog180))
  results.reorient180 = cog180

  // reorient '270' — CW 270° around Z = CCW 90°: [x,y,z] → [-y, x, z]
  // [20,15,10] → [-15, 20, 10]
  // + yOffset: [-15, 80, 10]
  // Combined: [(120-15)/2, (15+80)/2, (10+10)/2] = [52.5, 47.5, 10]
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { reorient: '270' } })
  const cog270 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[05] reorient 270: COG:', JSON.stringify(cog270))
  results.reorient270 = cog270

  // Verify state preserved yOffset
  const finalState = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Target' })).result
  console.log('[05] final: reorient=%s yOffset=%d', finalState?.mate1?.reorient, finalState?.yOffset)
  results.finalState = finalState

  filewrite(results, 'reorient-results')
  return { foId }
}
