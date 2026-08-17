// Explore the container.id vs container.owner relationship
// container.id seems to be a graphic container, container.owner seems to be the solid
// What IDs does requestVisualisation accept? solid IDs or graphic container IDs?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisIdOwner' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[13] boxId:', boxId)

  // Get vis to find the container.id and container.owner
  const r1 = await api.v1.common.requestVisualisation({ ids: [boxId] })
  const c = r1.graphic.containers[0]
  console.log('[13] container.id:', c.id, 'container.owner:', c.owner, 'container.type:', c.type)

  // Try requesting with the container.id instead of the solid ID (owner)
  const rContId = await api.v1.common.requestVisualisation({ ids: [c.id] })
  console.log('[13] with container.id:', c.id, '→ graphic?', !!rContId.graphic,
    'containers:', rContId.graphic?.containers?.length)

  // Try requesting with the owner
  const rOwnerId = await api.v1.common.requestVisualisation({ ids: [c.owner] })
  console.log('[13] with owner:', c.owner, '→ graphic?', !!rOwnerId.graphic,
    'containers:', rOwnerId.graphic?.containers?.length)

  // Which ID did we use originally? boxId vs c.owner vs c.id
  console.log('[13] boxId === owner?', boxId === c.owner)
  console.log('[13] boxId === containerId?', boxId === c.id)

  filewrite({
    boxId,
    containerId: c.id,
    ownerId: c.owner,
    boxIdIsOwner: boxId === c.owner,
    boxIdIsContainerId: boxId === c.id,
    containerIdWorks: !!rContId.graphic,
    ownerIdWorks: !!rOwnerId.graphic,
  }, 'id-vs-owner')

  return { partId }
}
