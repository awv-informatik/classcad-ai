export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create revolute with locked limits (min=0, max=0) so reorient is visible
  const revId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zRotationLimits: { min: 0, max: 0 },
  })).result

  const results = {}

  // Default reorient=0
  const cog0 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  results.reorient0 = cog0?.cog
  console.log('[03] reorient=0 COG:', JSON.stringify(cog0?.cog))

  // Update reorient to 90
  await api.v1.assembly.updateRevolute({ id: revId, mate2: { reorient: '90' } })
  const cog90 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  results.reorient90 = cog90?.cog
  console.log('[03] reorient=90 COG:', JSON.stringify(cog90?.cog))

  await snapshot('reorient-90')

  // Update reorient to 180
  await api.v1.assembly.updateRevolute({ id: revId, mate2: { reorient: '180' } })
  const cog180 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  results.reorient180 = cog180?.cog
  console.log('[03] reorient=180 COG:', JSON.stringify(cog180?.cog))

  // Update reorient to 270
  await api.v1.assembly.updateRevolute({ id: revId, mate2: { reorient: '270' } })
  const cog270 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  results.reorient270 = cog270?.cog
  console.log('[03] reorient=270 COG:', JSON.stringify(cog270?.cog))

  // Verify limits still locked and other state preserved
  const state = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[03] final state reorient:', state.mate2.reorient, 'limits:', JSON.stringify(state.zRotationLimits))
  results.finalState = state

  filewrite(results, 'reorient-data')
  return { revId }
}
