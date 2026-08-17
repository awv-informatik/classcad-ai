export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CompareTest' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 40, width: 30, height: 20, translation: [80, 0, 0] })).result

  // Set color via part.setAppearance
  const r1 = await api.v1.part.setAppearance({ target: box1, color: [255, 0, 0], transparency: 0.3 })
  console.log('[06] part.setAppearance:', r1.result, 'maxLevel:', r1.maxLevel)

  // Set color via common.setAppearance on different feature
  const r2 = await api.v1.common.setAppearance({ target: box2, color: [0, 0, 255], transparency: 0.5 })
  console.log('[06] common.setAppearance:', r2.result, 'maxLevel:', r2.maxLevel)

  // Now overwrite: use common on box1 (previously set by part)
  const r3 = await api.v1.common.setAppearance({ target: box1, color: [0, 255, 0] })
  console.log('[06] common overwrite part:', r3.result, 'maxLevel:', r3.maxLevel)

  // And part on box2 (previously set by common)
  const r4 = await api.v1.part.setAppearance({ target: box2, color: [255, 255, 0] })
  console.log('[06] part overwrite common:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    partOnBox1: { maxLevel: r1.maxLevel, msgs: r1.messages },
    commonOnBox2: { maxLevel: r2.maxLevel, msgs: r2.messages },
    commonOverwritePart: { maxLevel: r3.maxLevel, msgs: r3.messages },
    partOverwriteCommon: { maxLevel: r4.maxLevel, msgs: r4.messages },
  }, 'compare-results')

  await snapshot('compare')
  return { partId }
}
