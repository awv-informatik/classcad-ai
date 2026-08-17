// Test graphic visibility flags: do they affect r.graphic payload size/content?
export default async function (api, { filewrite }) {
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0, chordHeightTol: 0.1 })
  const partId = (await api.v1.part.create({ name: 'FlagTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create geometry
  await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30 })

  // All flags on
  await api.v1.common.setDatabaseSettings({
    isGraphicEnabled: 1, isCCGraphicEnabled: 1,
    isInvisibleGraphicEnabled: 1, isSketchGraphicEnabled: 1,
  })
  const boxR1 = await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20, translation: [40, 0, 0] })
  const g1Size = JSON.stringify(boxR1.graphic).length
  const m1 = boxR1.graphic?.containers?.[0]?.meshes?.[0]
  console.log('[15] all flags on: graphic size:', g1Size, 'vertices:', m1?.vertices?.length / 3)

  // All flags off
  await api.v1.common.setDatabaseSettings({
    isGraphicEnabled: 0, isCCGraphicEnabled: 0,
    isInvisibleGraphicEnabled: 0, isSketchGraphicEnabled: 0,
  })
  const boxR2 = await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20, translation: [0, 40, 0] })
  const g2Size = JSON.stringify(boxR2.graphic).length
  const m2 = boxR2.graphic?.containers?.[0]?.meshes?.[0]
  console.log('[15] all flags off: graphic size:', g2Size, 'vertices:', m2?.vertices?.length / 3)

  console.log('[15] size difference:', Math.abs(g1Size - g2Size), 'bytes')

  filewrite({
    flagsOn: { graphicSize: g1Size, vertices: m1?.vertices?.length / 3 },
    flagsOff: { graphicSize: g2Size, vertices: m2?.vertices?.length / 3 },
  }, 'flag-effect')
  return { partId }
}
