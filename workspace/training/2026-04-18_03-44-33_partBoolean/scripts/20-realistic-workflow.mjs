export default async function (api, { snapshot, filewrite }) {
  // Realistic: create a bracket-like shape using booleans
  // Base plate → add two risers → subtract bolt holes
  const partId = (await api.v1.part.create({ name: 'Bracket' })).result

  // Base plate
  const plate = (await api.v1.part.box({ id: partId, name: 'Plate', length: 120, width: 80, height: 10 })).result

  // Left riser
  const riserL = (await api.v1.part.box({ id: partId, name: 'RiserL', length: 15, width: 60, height: 60, translation: [0, 10, 10] })).result

  // Right riser
  const riserR = (await api.v1.part.box({ id: partId, name: 'RiserR', length: 15, width: 60, height: 60, translation: [105, 10, 10] })).result

  await snapshot('parts')

  // Union all three into one body
  const unionId = (await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    name: 'BracketBody',
    target: plate,
    tools: [riserL, riserR],
  })).result

  console.log('[20] unionId:', unionId)
  await snapshot('union')

  // Now create bolt holes and subtract them
  const hole1 = (await api.v1.part.cylinder({ id: partId, name: 'Hole1', diameter: 10, height: 20, translation: [30, 40, -5] })).result
  const hole2 = (await api.v1.part.cylinder({ id: partId, name: 'Hole2', diameter: 10, height: 20, translation: [60, 40, -5] })).result
  const hole3 = (await api.v1.part.cylinder({ id: partId, name: 'Hole3', diameter: 10, height: 20, translation: [90, 40, -5] })).result

  // Subtract all holes from the bracket
  const subId = (await api.v1.part.boolean({
    id: partId,
    type: 'SUBTRACTION',
    name: 'BoltHoles',
    target: unionId,
    tools: [hole1, hole2, hole3],
  })).result

  console.log('[20] subId:', subId)
  filewrite({ unionId, subId }, 'workflow-ids')

  await snapshot('final')

  return { partId }
}
