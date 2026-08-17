// Q: What is the default direction for ar when there's no prior segment?
// Strategy: Compare ar-based shapes with equivalent a-based shapes visually
// Add endpoint markers (short perpendicular ticks) to verify positions match
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Pair A: ar=0 vs a=0
  const sA1 = (await api.v1.curve.shape({ id: eifId, name: 'ar0' })).result
  const rA1 = await api.v1.curve.advancedPolyline({ id: sA1, pld: [
    { xa: 0, ya: 0 }, { l: 40, ar: 0 },
  ]})
  // Use the response structure to check if it contains position data
  filewrite({ result: rA1.result, maxLevel: rA1.maxLevel }, 'ar0-response')

  const sA2 = (await api.v1.curve.shape({ id: eifId, name: 'a0' })).result
  await api.v1.curve.advancedPolyline({ id: sA2, pld: [
    { xa: 0, ya: 10 }, { l: 40, a: 0 },
  ]})

  // Pair B: ar=PI/2 vs a=PI/2
  const sB1 = (await api.v1.curve.shape({ id: eifId, name: 'arPi2' })).result
  await api.v1.curve.advancedPolyline({ id: sB1, pld: [
    { xa: 60, ya: 0 }, { l: 40, ar: Math.PI / 2 },
  ]})

  const sB2 = (await api.v1.curve.shape({ id: eifId, name: 'aPi2' })).result
  await api.v1.curve.advancedPolyline({ id: sB2, pld: [
    { xa: 60, ya: 10 }, { l: 40, a: Math.PI / 2 },
  ]})

  // Pair C: ar=PI vs a=PI
  const sC1 = (await api.v1.curve.shape({ id: eifId, name: 'arPi' })).result
  await api.v1.curve.advancedPolyline({ id: sC1, pld: [
    { xa: 120, ya: 0 }, { l: 40, ar: Math.PI },
  ]})

  const sC2 = (await api.v1.curve.shape({ id: eifId, name: 'aPi' })).result
  await api.v1.curve.advancedPolyline({ id: sC2, pld: [
    { xa: 120, ya: 10 }, { l: 40, a: Math.PI },
  ]})

  // Use the graphic data from a full operation to check shape positions
  const lastR = await api.v1.curve.advancedPolyline({ id: sC2, pld: [
    { xa: 120, ya: 20 }, { l: 5, a: 0 },  // add a small marker
  ]})
  filewrite(lastR.graphic, 'graphic-data')

  await snapshot('ar-default-verify')
  return { partId }
}
