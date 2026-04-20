export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  // Create work plane, work axis, work point — none should work as references
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'WA1', origin: [0, 0, 0], direction: [0, 1, 0] })).result
  const wptId = (await api.v1.part.workPoint({ id: partId, name: 'WPt1', position: [5, 5, 5] })).result

  console.log('[04] wpId:', wpId, 'waId:', waId, 'wptId:', wptId)

  // Try workPlane as reference
  const r1 = await api.v1.part.sphere({ id: partId, name: 'WithWP', radius: 30, references: [wpId] })
  console.log('[04] workPlane ref:', r1.result, 'maxLevel:', r1.maxLevel)

  // Try workAxis as reference
  const r2 = await api.v1.part.sphere({ id: partId, name: 'WithWA', radius: 30, references: [waId] })
  console.log('[04] workAxis ref:', r2.result, 'maxLevel:', r2.maxLevel)

  // Try workPoint as reference
  const r3 = await api.v1.part.sphere({ id: partId, name: 'WithWPt', radius: 30, references: [wptId] })
  console.log('[04] workPoint ref:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    workPlane: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    workAxis: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    workPoint: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
  }, 'invalid-refs-response')

  return { partId }
}
