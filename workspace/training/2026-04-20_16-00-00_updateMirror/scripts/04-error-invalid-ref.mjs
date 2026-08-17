export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorTest' })).result
  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [30, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 50, references: [wcs],
  })).result

  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
  const mirrorId = (await api.v1.part.mirror({
    id: partId, name: 'Mirror1',
    targets: [boxId], references: [rightWp],
  })).result

  const results = {}

  // Test 1: invalid reference ID
  await api.v1.part.openFeature({ id: mirrorId })
  const r1 = await api.v1.part.updateMirror({ id: mirrorId, references: [99999] })
  await api.v1.part.closeFeature({ id: mirrorId })
  results.invalidRef = { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }
  console.log('[04] invalidRef result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Test 2: empty references array
  await api.v1.part.openFeature({ id: mirrorId })
  const r2 = await api.v1.part.updateMirror({ id: mirrorId, references: [] })
  await api.v1.part.closeFeature({ id: mirrorId })
  results.emptyRef = { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  console.log('[04] emptyRef result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Test 3: empty targets array
  await api.v1.part.openFeature({ id: mirrorId })
  const r3 = await api.v1.part.updateMirror({ id: mirrorId, targets: [] })
  await api.v1.part.closeFeature({ id: mirrorId })
  results.emptyTargets = { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  console.log('[04] emptyTargets result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Test 4: invalid target ID
  await api.v1.part.openFeature({ id: mirrorId })
  const r4 = await api.v1.part.updateMirror({ id: mirrorId, targets: [99999] })
  await api.v1.part.closeFeature({ id: mirrorId })
  results.invalidTarget = { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }
  console.log('[04] invalidTarget result:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite(results, 'error-cases')

  await snapshot('after-errors')

  return { partId, mirrorId }
}
