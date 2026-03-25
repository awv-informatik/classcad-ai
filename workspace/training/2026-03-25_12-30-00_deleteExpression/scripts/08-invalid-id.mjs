// Missing and invalid id
export default async function (api) {
  const r1 = await api.v1.part.deleteExpression({ toDelete: ['x'] })
  console.log('[08] no id result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) console.log('[08] msg:', m.level, m.code, m.message)
  }

  const r2 = await api.v1.part.deleteExpression({ id: 'bogus', toDelete: ['x'] })
  console.log('[08] bogus id result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log('[08] msg:', m.level, m.code, m.message)
  }

  return {}
}
