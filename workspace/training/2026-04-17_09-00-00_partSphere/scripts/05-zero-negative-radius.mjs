export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  // Zero radius
  const r1 = await api.v1.part.sphere({ id: partId, name: 'Zero', radius: 0 })
  console.log('[05] zero radius:', r1.result, 'maxLevel:', r1.maxLevel)

  // Negative radius
  const r2 = await api.v1.part.sphere({ id: partId, name: 'Negative', radius: -10 })
  console.log('[05] negative radius:', r2.result, 'maxLevel:', r2.maxLevel)

  // Very small positive radius
  const r3 = await api.v1.part.sphere({ id: partId, name: 'Tiny', radius: 0.001 })
  console.log('[05] tiny radius:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    zero: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    negative: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    tiny: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
  }, 'edge-cases-response')

  return { partId }
}
