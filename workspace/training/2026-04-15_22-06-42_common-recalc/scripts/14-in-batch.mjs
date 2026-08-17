// Test recalc inside a batch call
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchRecalc' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })

  // Call recalc via batch
  const batchR = await api.v1.common.batch({
    jobs: [
      { api: 'v1.common.recalc' },
      { api: 'v1.common.getAppVersion' },
    ]
  })
  console.log('[14] batch result:', JSON.stringify(batchR.result))
  console.log('[14] batch maxLevel:', batchR.maxLevel)
  filewrite({ batchResult: batchR.result, maxLevel: batchR.maxLevel, messages: batchR.messages }, 'batch-recalc')
  return { batchResult: batchR.result }
}
