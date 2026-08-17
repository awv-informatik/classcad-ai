export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ImportTest' })).result

  // Test CC_Import (the correct class name for importFeature)
  const importId = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Import', name: 'MyImport' })).result
  console.log('[17] CC_Import:', importId, importId ? 'OK' : 'FAILED')

  if (importId) {
    // Check its default structure
    const r = await api.v1.common.recalc({})
    const node = r.structure?.tree?.[importId]
    if (node) {
      console.log('[17] import node class:', node.class, 'members:', Object.keys(node.members))
      filewrite(node, 'import-node')
    }

    // Commit it
    await api.v1.part.openFeature({ id: importId })
    await api.v1.part.closeFeature({ id: importId })
  }

  // Test getFeature timing — does recalc affect findability?
  const box1 = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'TimingBox' })).result
  console.log('[17] uncommitted box:', box1)

  // getFeature BEFORE recalc
  const get1 = await api.v1.part.getFeature({ id: partId, name: 'TimingBox' })
  console.log('[17] getFeature before recalc:', get1.result, 'maxLevel:', get1.maxLevel)

  // getFeature AFTER recalc
  await api.v1.common.recalc({})
  const get2 = await api.v1.part.getFeature({ id: partId, name: 'TimingBox' })
  console.log('[17] getFeature after recalc:', get2.result, 'maxLevel:', get2.maxLevel)

  // Commit and test again
  await api.v1.part.openFeature({ id: box1 })
  await api.v1.part.updateBox({ id: box1, length: 50, width: 30, height: 20 })
  await api.v1.part.closeFeature({ id: box1 })

  const get3 = await api.v1.part.getFeature({ id: partId, name: 'TimingBox' })
  console.log('[17] getFeature after commit:', get3.result, 'maxLevel:', get3.maxLevel)

  return { partId }
}
