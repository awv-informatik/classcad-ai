// Test save as STEP format — versions AP203, AP214, AP242
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SaveSTP' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Default STP (AP214)
  const stp214 = await api.v1.common.save({ format: 'STP' })
  console.log('[05] STP AP214 success:', stp214.result.success)
  console.log('[05] STP AP214 length:', stp214.result.content?.length)
  console.log('[05] STP AP214 first 200:', stp214.result.content?.substring(0, 200))
  console.log('[05] STP AP214 maxLevel:', stp214.maxLevel)

  // AP203
  const stp203 = await api.v1.common.save({ format: 'STP', stp: { version: 1 } })
  console.log('[05] STP AP203 success:', stp203.result.success)
  console.log('[05] STP AP203 length:', stp203.result.content?.length)

  // AP242
  const stp242 = await api.v1.common.save({ format: 'STP', stp: { version: 3 } })
  console.log('[05] STP AP242 success:', stp242.result.success)
  console.log('[05] STP AP242 length:', stp242.result.content?.length)

  // With asPart=TRUE
  const stpPart = await api.v1.common.save({ format: 'STP', stp: { asPart: 1 } })
  console.log('[05] STP asPart success:', stpPart.result.success)
  console.log('[05] STP asPart length:', stpPart.result.content?.length)

  // With header info
  const stpHeader = await api.v1.common.save({ format: 'STP', stp: { version: 2, header: { filename: { name: 'test-model.stp', organization: 'TestOrg' } } } })
  console.log('[05] STP header success:', stpHeader.result.success)
  console.log('[05] STP header length:', stpHeader.result.content?.length)

  filewrite({
    ap214: { success: stp214.result.success, length: stp214.result.content?.length, maxLevel: stp214.maxLevel },
    ap203: { success: stp203.result.success, length: stp203.result.content?.length },
    ap242: { success: stp242.result.success, length: stp242.result.content?.length },
    asPart: { success: stpPart.result.success, length: stpPart.result.content?.length },
    header: { success: stpHeader.result.success, length: stpHeader.result.content?.length },
    preview214: stp214.result.content?.substring(0, 500),
  }, 'stp-comparison')

  return { partId }
}
