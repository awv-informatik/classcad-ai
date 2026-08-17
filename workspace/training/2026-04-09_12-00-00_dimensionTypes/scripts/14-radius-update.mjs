// Test updateDimension on RADIUS/DIAMETER and verify value storage
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle r=35
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 50, 0], radius: 35 })).result

  // RADIUS dim
  const radDim = (await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circle], name: 'rad' })).result
  // DIAMETER dim
  const diaDim = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [circle], name: 'dia' })).result
  console.log('[14] radDim:', radDim, 'diaDim:', diaDim)

  // Check initial values
  function findNode(obj, id) {
    if (!obj || typeof obj !== 'object') return null
    if (obj.id === id) return obj
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        for (const item of obj[key]) { const r = findNode(item, id); if (r) return r }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        const r = findNode(obj[key], id); if (r) return r
      }
    }
    return null
  }

  // Get initial structure
  const initR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [circle], name: 'dummy' })
  // Oops, OFFSET on circle fails. Let me just get the structure another way
  // Actually let's just get it from the last successful call

  // Update RADIUS to 50
  const u1 = await api.v1.sketch.updateDimension({ id: radDim, value: 50 })
  console.log('[14] update RADIUS to 50:', u1.result, 'maxLevel=', u1.maxLevel)

  let radNode = findNode(u1.structure, radDim)
  console.log('[14] RADIUS after update: value=', radNode?.members?.value?.value, 'radius=', radNode?.members?.radius?.value, 'paramName=', radNode?.members?.paramName?.value)

  // Update DIAMETER to 120
  const u2 = await api.v1.sketch.updateDimension({ id: diaDim, value: 120 })
  console.log('[14] update DIAMETER to 120:', u2.result, 'maxLevel=', u2.maxLevel)

  let diaNode = findNode(u2.structure, diaDim)
  radNode = findNode(u2.structure, radDim)
  console.log('[14] DIAMETER after update: value=', diaNode?.members?.value?.value, 'radius=', diaNode?.members?.radius?.value, 'paramName=', diaNode?.members?.paramName?.value)
  console.log('[14] RADIUS after DIAMETER update: value=', radNode?.members?.value?.value, 'radius=', radNode?.members?.radius?.value)

  // Can we set RADIUS as an expression?
  const u3 = await api.v1.sketch.updateDimension({ id: radDim, value: '25mm' })
  console.log('[14] update RADIUS to 25mm:', u3.result, 'maxLevel=', u3.maxLevel)
  radNode = findNode(u3.structure, radDim)
  console.log('[14] RADIUS after 25mm: value=', radNode?.members?.value?.value, 'paramName=', radNode?.members?.paramName?.value)

  await snapshot('radius-update')
  return { partId }
}
