// Definitive test: compare transformShape vs translateShape+rotateShape equivalence
// Create two shapes, apply equivalent transforms, see if they match
export default async function (api, { snapshot, filewrite }) {
  // Shape A: use translateShape then rotateShape
  const pA = (await api.v1.part.create({ name: 'ViaAPIs' })).result
  const eiA = (await api.v1.part.entityInjection({ id: pA })).result
  const sA = (await api.v1.curve.shape({ id: eiA, name: 'A' })).result
  await api.v1.curve.circle({ id: sA, centerPos: [15, 10, 0], radius: 8 })
  await api.v1.curve.line({ id: sA, startPos: [0, 0, 0], endPos: [30, 0, 0] })

  // Translate +50 X, +20 Y
  const tA = await api.v1.curve.translateShape({ id: sA, translation: [50, 20, 0] })
  console.log('[20] translateShape A:', tA.maxLevel)
  filewrite(tA.graphic, 'A-after-translate-graphic')

  await snapshot('20-A-translated')

  // Shape B: use transformShape with equivalent translation matrix
  const pB = (await api.v1.part.create({ name: 'ViaMatrix' })).result
  const eiB = (await api.v1.part.entityInjection({ id: pB })).result
  const sB = (await api.v1.curve.shape({ id: eiB, name: 'B' })).result
  await api.v1.curve.circle({ id: sB, centerPos: [15, 10, 0], radius: 8 })
  await api.v1.curve.line({ id: sB, startPos: [0, 0, 0], endPos: [30, 0, 0] })

  const tB = await api.v1.curve.transformShape({
    id: sB,
    matrix: [
      [1, 0, 0, 50],
      [0, 1, 0, 20],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[20] transformShape B:', tB.maxLevel)
  filewrite(tB.graphic, 'B-after-transform-graphic')

  await snapshot('20-B-transformed')

  // Compare edge data from both graphics
  const edgesA = tA.graphic?.containers?.flatMap(c => c.edges || []).map(e => e.points)
  const edgesB = tB.graphic?.containers?.flatMap(c => c.edges || []).map(e => e.points)
  console.log('[20] A edges:', JSON.stringify(edgesA))
  console.log('[20] B edges:', JSON.stringify(edgesB))
  const match = JSON.stringify(edgesA) === JSON.stringify(edgesB)
  console.log('[20] Edge data match:', match)

  filewrite({ edgesA, edgesB, match }, 'edge-comparison')

  return { pA, pB }
}
