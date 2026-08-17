export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result
  const t1 = (await api.v1.assembly.assemblyTemplate({ name: 'Alpha' })).result
  const t2 = (await api.v1.assembly.assemblyTemplate({ name: 'Beta' })).result
  console.log('[02] templates:', t1, t2)

  // Exact match
  const rAlpha = await api.v1.assembly.getAssemblyTemplate({ name: 'Alpha' })
  const rBeta = await api.v1.assembly.getAssemblyTemplate({ name: 'Beta' })

  // Case sensitivity
  const rLower = await api.v1.assembly.getAssemblyTemplate({ name: 'alpha' })
  const rUpper = await api.v1.assembly.getAssemblyTemplate({ name: 'ALPHA' })
  const rPartial = await api.v1.assembly.getAssemblyTemplate({ name: 'Alp' })

  // Not found
  const rMissing = await api.v1.assembly.getAssemblyTemplate({ name: 'DoesNotExist' })

  filewrite({
    exactAlpha: { result: rAlpha.result, maxLevel: rAlpha.maxLevel, type: typeof rAlpha.result, isArray: Array.isArray(rAlpha.result) },
    exactBeta: { result: rBeta.result, maxLevel: rBeta.maxLevel, type: typeof rBeta.result },
    lowercase: { result: rLower.result, maxLevel: rLower.maxLevel, messages: rLower.messages },
    uppercase: { result: rUpper.result, maxLevel: rUpper.maxLevel },
    partial: { result: rPartial.result, maxLevel: rPartial.maxLevel },
    notFound: { result: rMissing.result, maxLevel: rMissing.maxLevel, messages: rMissing.messages },
  }, 'by-name-results')

  console.log('[02] Alpha:', rAlpha.result, '(maxLevel:', rAlpha.maxLevel, ')')
  console.log('[02] Beta:', rBeta.result, '(maxLevel:', rBeta.maxLevel, ')')
  console.log('[02] lowercase:', rLower.result, '(maxLevel:', rLower.maxLevel, ')')
  console.log('[02] UPPER:', rUpper.result, '(maxLevel:', rUpper.maxLevel, ')')
  console.log('[02] partial:', rPartial.result, '(maxLevel:', rPartial.maxLevel, ')')
  console.log('[02] not-found:', rMissing.result, '(maxLevel:', rMissing.maxLevel, ')')

  return { asmId }
}
