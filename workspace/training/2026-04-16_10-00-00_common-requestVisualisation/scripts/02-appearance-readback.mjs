// Test requestVisualisation as a read-back mechanism for setAppearance
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisAppearance' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  // Get default appearance before setAppearance
  const before = await api.v1.common.requestVisualisation({ ids: [boxId] })
  const beforeProps = before.graphic.containers[0].properties
  console.log('[02] BEFORE color:', JSON.stringify(beforeProps.material.color))
  console.log('[02] BEFORE opacity:', beforeProps.material.opacity)

  // Set color to red with 0.5 transparency
  await api.v1.common.setAppearance({ target: eifId, color: [255, 0, 0], transparency: 0.5 })

  // Read back via requestVisualisation
  const after = await api.v1.common.requestVisualisation({ ids: [boxId] })
  const afterProps = after.graphic.containers[0].properties
  console.log('[02] AFTER color:', JSON.stringify(afterProps.material.color))
  console.log('[02] AFTER opacity:', afterProps.material.opacity)

  filewrite({
    before: { color: beforeProps.material.color, opacity: beforeProps.material.opacity },
    after: { color: afterProps.material.color, opacity: afterProps.material.opacity },
  }, 'appearance-readback')

  await snapshot('appearance-readback')
  return { partId, eifId, boxId }
}
