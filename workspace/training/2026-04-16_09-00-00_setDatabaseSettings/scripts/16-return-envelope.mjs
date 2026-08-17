// Examine the full return envelope of setDatabaseSettings — messages content
export default async function (api, { filewrite }) {
  // Successful call
  const r1 = await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.2 })
  console.log('[16] success: result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[16] messages count:', r1.messages?.length)
  if (r1.messages) {
    for (const m of r1.messages) {
      console.log('[16]   msg:', m.message, 'level:', m.level, 'code:', m.code, 'api:', m.api)
    }
  }

  // Error call (zero chord)
  const r2 = await api.v1.common.setDatabaseSettings({ chordHeightTol: 0 })
  console.log('[16] error: result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages) {
    for (const m of r2.messages) {
      console.log('[16]   msg:', m.message, 'level:', m.level, 'code:', m.code, 'api:', m.api)
    }
  }

  // String error
  const r3 = await api.v1.common.setDatabaseSettings({ isGraphicEnabled: 'bad' })
  console.log('[16] type error: result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages) {
    for (const m of r3.messages) {
      console.log('[16]   msg:', m.message, 'level:', m.level, 'code:', m.code, 'api:', m.api)
    }
  }

  filewrite({
    success: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    error: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    typeError: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'return-envelope')
  return {}
}
