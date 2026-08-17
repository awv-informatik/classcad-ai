// Test requestVisualisation with different entity types: sketch, work geometry, curves
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisTypes' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  // Create a sketch
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[04] skId:', skId, 'lineId:', lineId)

  // Create work geometry
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  console.log('[04] wpId:', wpId)

  // Create a shape with curves
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [30, 30, 0] })
  console.log('[04] shapeId:', shapeId)

  // Test with solid (known to work)
  const rSolid = await api.v1.common.requestVisualisation({ ids: [boxId] })
  console.log('[04] solid: graphic?', !!rSolid.graphic, 'containers:', rSolid.graphic?.containers?.length)

  // Test with sketch ID
  const rSketch = await api.v1.common.requestVisualisation({ ids: [skId] })
  console.log('[04] sketch: result:', rSketch.result, 'maxLevel:', rSketch.maxLevel)
  console.log('[04] sketch: graphic?', !!rSketch.graphic, 'containers:', rSketch.graphic?.containers?.length)
  if (rSketch.graphic?.containers?.length > 0) {
    filewrite(rSketch.graphic.containers.map(c => ({
      id: c.id, owner: c.owner, type: c.type,
      keys: Object.keys(c),
      hasEdges: !!(c.edges && c.edges.length),
      hasMeshes: !!(c.meshes && c.meshes.length),
    })), 'sketch-containers')
  }

  // Test with work plane ID
  const rWP = await api.v1.common.requestVisualisation({ ids: [wpId] })
  console.log('[04] workPlane: result:', rWP.result, 'maxLevel:', rWP.maxLevel)
  console.log('[04] workPlane: graphic?', !!rWP.graphic, 'containers:', rWP.graphic?.containers?.length)
  if (rWP.graphic?.containers?.length > 0) {
    filewrite(rWP.graphic.containers.map(c => ({
      id: c.id, owner: c.owner, type: c.type,
      keys: Object.keys(c),
    })), 'workplane-containers')
  }

  // Test with shape ID (curve container)
  const rShape = await api.v1.common.requestVisualisation({ ids: [shapeId] })
  console.log('[04] shape: result:', rShape.result, 'maxLevel:', rShape.maxLevel)
  console.log('[04] shape: graphic?', !!rShape.graphic, 'containers:', rShape.graphic?.containers?.length)

  // Test with sketch line ID (individual geometry)
  const rLine = await api.v1.common.requestVisualisation({ ids: [lineId] })
  console.log('[04] sketchLine: result:', rLine.result, 'maxLevel:', rLine.maxLevel)
  console.log('[04] sketchLine: graphic?', !!rLine.graphic, 'containers:', rLine.graphic?.containers?.length)

  // Test with entity injection feature ID
  const rEif = await api.v1.common.requestVisualisation({ ids: [eifId] })
  console.log('[04] eifId: graphic?', !!rEif.graphic, 'containers:', rEif.graphic?.containers?.length)

  // Test with part ID
  const rPart = await api.v1.common.requestVisualisation({ ids: [partId] })
  console.log('[04] partId: graphic?', !!rPart.graphic, 'containers:', rPart.graphic?.containers?.length)

  filewrite({
    solid: { graphic: !!rSolid.graphic, containers: rSolid.graphic?.containers?.length },
    sketch: { graphic: !!rSketch.graphic, containers: rSketch.graphic?.containers?.length, maxLevel: rSketch.maxLevel },
    workPlane: { graphic: !!rWP.graphic, containers: rWP.graphic?.containers?.length, maxLevel: rWP.maxLevel },
    shape: { graphic: !!rShape.graphic, containers: rShape.graphic?.containers?.length, maxLevel: rShape.maxLevel },
    sketchLine: { graphic: !!rLine.graphic, containers: rLine.graphic?.containers?.length, maxLevel: rLine.maxLevel },
    eif: { graphic: !!rEif.graphic, containers: rEif.graphic?.containers?.length },
    part: { graphic: !!rPart.graphic, containers: rPart.graphic?.containers?.length },
  }, 'entity-type-results')

  await snapshot('types')
  return { partId }
}
