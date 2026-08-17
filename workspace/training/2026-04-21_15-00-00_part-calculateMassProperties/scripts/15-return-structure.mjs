export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructureTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 50, width: 50, height: 50 })).result

  // Get the full response to study the return envelope
  const r = await api.v1.part.calculateMassProperties({ id: partId })

  // Log every top-level key
  console.log('[15] envelope keys:', Object.keys(r).join(', '))
  console.log('[15] result type:', typeof r.result)
  console.log('[15] result keys:', r.result ? Object.keys(r.result).join(', ') : 'null')
  console.log('[15] cog type:', typeof r.result?.cog)
  console.log('[15] cog keys:', r.result?.cog ? Object.keys(r.result.cog).join(', ') : 'null')
  console.log('[15] volume type:', typeof r.result?.volume)
  console.log('[15] result.cog:', JSON.stringify(r.result?.cog))
  console.log('[15] result.volume:', r.result?.volume)
  console.log('[15] maxLevel:', r.maxLevel)
  console.log('[15] messages length:', r.messages?.length)
  console.log('[15] has structure:', !!r.structure)
  console.log('[15] has graphic:', !!r.graphic)

  filewrite({
    envelopeKeys: Object.keys(r),
    resultKeys: r.result ? Object.keys(r.result) : null,
    cogKeys: r.result?.cog ? Object.keys(r.result.cog) : null,
    cogIsArray: Array.isArray(r.result?.cog),
    cogIsObject: typeof r.result?.cog === 'object',
    result: r.result,
    maxLevel: r.maxLevel,
    messagesLength: r.messages?.length,
  }, 'return-structure')

  return { partId }
}
