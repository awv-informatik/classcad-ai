// Test STP analytic option — converts to analytic geometry on export
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'STPAnalytic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })
  await api.v1.solid.cylinder({ id: eifId, radius: 20, height: 60 })

  // Default (analytic=0, no conversion)
  const noAnalytic = await api.v1.common.save({ format: 'STP', stp: { analytic: 0 } })
  console.log('[13] STP analytic=0 length:', noAnalytic.result.content?.length)

  // Analytic conversion enabled
  const withAnalytic = await api.v1.common.save({ format: 'STP', stp: { analytic: 1 } })
  console.log('[13] STP analytic=1 length:', withAnalytic.result.content?.length)
  console.log('[13] STP analytic=1 success:', withAnalytic.result.success)
  console.log('[13] STP analytic=1 maxLevel:', withAnalytic.maxLevel)

  filewrite({
    noAnalytic: { length: noAnalytic.result.content?.length },
    withAnalytic: { length: withAnalytic.result.content?.length, success: withAnalytic.result.success },
  }, 'stp-analytic')

  return { partId }
}
