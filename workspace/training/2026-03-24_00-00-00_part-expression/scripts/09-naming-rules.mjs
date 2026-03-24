// Test: expression naming rules — what names are valid?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const tests = [
    { name: 'simple', value: 1, label: 'simple alpha' },
    { name: 'with_underscore', value: 2, label: 'underscore' },
    { name: 'camelCase', value: 3, label: 'camelCase' },
    { name: 'x1', value: 4, label: 'alpha+digit' },
    { name: '1start', value: 5, label: 'digit-start' },
    { name: 'with space', value: 6, label: 'space in name' },
    { name: 'with-dash', value: 7, label: 'dash in name' },
    { name: 'with.dot', value: 8, label: 'dot in name' },
    { name: '', value: 9, label: 'empty name' },
    { name: 'A', value: 10, label: 'single char' },
  ]

  for (const t of tests) {
    const r = await api.v1.part.expression({
      id: partId,
      toCreate: [{ name: t.name, value: t.value }],
    })
    const ok = r.result === 1 || r.result === true
    console.log(`[09] ${t.label}: ${ok ? '✓' : '✗'} result=${r.result} maxLevel=${r.maxLevel}`)
    if (!ok && r.messages?.length) {
      console.log(`[09]   error: ${r.messages[0].message.substring(0, 100)}`)
    }
  }

  return { partId }
}
