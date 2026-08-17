export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TypeTest' })).result

  const tests = [
    { key: 'num', value: 42, label: 'number value' },
    { key: 'float', value: 3.14, label: 'float value' },
    { key: 'bool-true', value: true, label: 'boolean true' },
    { key: 'bool-false', value: false, label: 'boolean false' },
    { key: 'null-val', value: null, label: 'null value' },
    { key: 'undef-val', value: undefined, label: 'undefined value' },
    { key: 'array', value: [1, 2, 3], label: 'array value' },
    { key: 'object', value: { a: 1 }, label: 'object value' },
  ]

  const results = []
  for (const t of tests) {
    try {
      const setR = await api.v1.common.setUserData({ id: partId, key: t.key, value: t.value })
      const getR = await api.v1.common.getUserData({ id: partId, key: t.key, defaultValue: 'NOT_SET' })
      console.log(`[06] ${t.label}: set maxLevel=${setR.maxLevel}, get=${JSON.stringify(getR.result)}, type=${typeof getR.result}`)
      results.push({ label: t.label, input: t.value, inputType: typeof t.value, setMaxLevel: setR.maxLevel, getResult: getR.result, getType: typeof getR.result })
    } catch (err) {
      console.log(`[06] ${t.label}: ERROR ${err.message}`)
      results.push({ label: t.label, error: err.message })
    }
  }

  const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log(`[06] final keys:`, JSON.stringify(keys))
  results.push({ finalKeys: keys })

  filewrite(results, 'type-coercion')
  return { partId }
}
