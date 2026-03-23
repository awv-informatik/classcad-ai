// Test: boolean result type from APIs that declare boolean returns
// sketch.isSolved returns boolean — is it JS true/false or 1/0?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'BoolTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // isSolved on fresh empty sketch
  const r1 = await api.v1.sketch.isSolved({ id: skId })
  const v1 = r1.result
  console.log(`[bool] isSolved(empty) result=${JSON.stringify(v1)} type=${typeof v1} ===true:${v1===true} ===false:${v1===false} ===1:${v1===1} ===0:${v1===0}`)

  // Add geometry then check again
  await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [50, 50, 0] })
  const r2 = await api.v1.sketch.isSolved({ id: skId })
  const v2 = r2.result
  console.log(`[bool] isSolved(rect) result=${JSON.stringify(v2)} type=${typeof v2} ===true:${v2===true} ===false:${v2===false} ===1:${v2===1} ===0:${v2===0}`)

  // moveGeometry also returns boolean
  const lines = (await api.v1.sketch.rectangle({ id: skId, startPos: [60, 0, 0], endPos: [100, 40, 0] })).result
  const r3 = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [lines[0]], translation: [5, 5, 0] })
  const v3 = r3.result
  console.log(`[bool] moveGeometry result=${JSON.stringify(v3)} type=${typeof v3} ===true:${v3===true} ===false:${v3===false} ===1:${v3===1} ===0:${v3===0}`)

  return {}
}
