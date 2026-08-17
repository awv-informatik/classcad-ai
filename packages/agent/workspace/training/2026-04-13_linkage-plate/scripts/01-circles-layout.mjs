// 01-circles-layout.mjs — Place all major circles to establish layout
// Goal: verify circle centers against source drawing proportions
// Origin: left edge of part, horizontal centerline at y = 0

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }

  // === KNOWN POSITIONS ===

  // Left lobe arcs (R.750): from 1.875 height constraint
  // y_center = (1.875 - 2*0.750) / 2 = 0.1875
  // x_center = 0.750 (left edge at x=0)
  const lobeTopCenter = [0.750, 0.1875]
  const lobeBotCenter = [0.750, -0.1875]

  // Main vertical axis at x = 0.750 + 1.000 = 1.750
  // Ø1.625 and Ø0.750 concentric at (1.750, 0.750) — .750 above centerline
  const upperHoleCenter = [1.750, 0.750]

  // Ø1.750 center — on the main axis, below centerline
  // The exact y is constrained by tangency with R1.750 and R1.375
  // Estimate: y ≈ -0.500 (from visual proportions)
  const lowerHubCenter = [1.750, -0.500]

  // Ø1.125 center — appears near the Ø1.750 but offset right
  // From drawing: seems to be between Ø1.750 and R1.375 areas
  // Estimate: (2.500, -0.300)
  const midHoleCenter = [2.500, -0.300]

  // R1.375 center — from 2.312 dimension: x = 1.750 + 2.312 = 4.062
  // y estimate: on or below centerline (lower-right profile arc)
  const r1375Center = [4.062, -0.500]

  // R1.750 center — large arc connecting left lobe to upper area
  // Must be tangent to upper R.750 arc (internal tangent: dist = R1.750 - R.750 = 1.000)
  // R.750 top center at (0.750, 0.1875)
  // R1.750 center at distance 1.000 from (0.750, 0.1875) — direction: roughly right and down
  // Estimate: (1.750, 0.1875) — directly right (on centerline area)
  // Actually for the arc to curve around the top, center should be BELOW the feature
  // If center is below, the arc curves upward. Let me try center below the left lobe:
  const r1750Center = [1.750, -0.750]

  // Right arm — at 40° from horizontal, centered near R1.375 area
  // The right arm has R.625, R.438, R.875 arcs
  // Approximate right arm center: (4.500, 0.500) — above and right
  const rightArmCenter = [4.500, 0.700]

  // === DRAW ALL CIRCLES (FULL) FOR LAYOUT CHECK ===

  // Through-holes
  await api.v1.sketch.circle({ id: skId, centerPos: [...upperHoleCenter, 0], radius: 0.8125, ...noGen }) // Ø1.625
  await api.v1.sketch.circle({ id: skId, centerPos: [...upperHoleCenter, 0], radius: 0.375, ...noGen })  // Ø0.750
  await api.v1.sketch.circle({ id: skId, centerPos: [...lowerHubCenter, 0], radius: 0.875, ...noGen })   // Ø1.750
  await api.v1.sketch.circle({ id: skId, centerPos: [...midHoleCenter, 0], radius: 0.5625, ...noGen })   // Ø1.125

  // Left lobe outer arcs (as full circles for now)
  await api.v1.sketch.circle({ id: skId, centerPos: [...lobeTopCenter, 0], radius: 0.750, ...noGen })
  await api.v1.sketch.circle({ id: skId, centerPos: [...lobeBotCenter, 0], radius: 0.750, ...noGen })

  // Left lobe inner slot arcs
  await api.v1.sketch.circle({ id: skId, centerPos: [...lobeTopCenter, 0], radius: 0.437, ...noGen })
  await api.v1.sketch.circle({ id: skId, centerPos: [...lobeBotCenter, 0], radius: 0.437, ...noGen })

  // Profile arcs (as full circles)
  await api.v1.sketch.circle({ id: skId, centerPos: [...r1750Center, 0], radius: 1.750, ...noGen })  // R1.750
  await api.v1.sketch.circle({ id: skId, centerPos: [...r1375Center, 0], radius: 1.375, ...noGen })  // R1.375

  // Right arm arcs — rough placement
  // R.625 arcs near the upper-right transition
  await api.v1.sketch.circle({ id: skId, centerPos: [3.500, 0.800, 0], radius: 0.625, ...noGen })
  // R.438 arcs
  await api.v1.sketch.circle({ id: skId, centerPos: [4.200, 0.900, 0], radius: 0.438, ...noGen })
  // R.875 arcs at the right arm tip
  await api.v1.sketch.circle({ id: skId, centerPos: [4.800, 0.400, 0], radius: 0.875, ...noGen })
  await api.v1.sketch.circle({ id: skId, centerPos: [5.000, -0.400, 0], radius: 0.875, ...noGen })

  // Reference lines for visual alignment
  // Horizontal centerline
  await api.v1.sketch.line({ id: skId, startPos: [-0.5, 0, 0], endPos: [6.5, 0, 0], ...noGen })
  // Vertical axis at x = 1.750
  await api.v1.sketch.line({ id: skId, startPos: [1.750, -2, 0], endPos: [1.750, 2, 0], ...noGen })
  // 40° line from right arm area
  const ang40 = 40 * Math.PI / 180
  await api.v1.sketch.line({ id: skId,
    startPos: [3.500, -0.500, 0],
    endPos: [3.500 + 3*Math.cos(ang40), -0.500 + 3*Math.sin(ang40), 0],
    ...noGen
  })

  console.log('[01] Layout circles placed. Compare with source.')

  filewrite({
    centers: {
      lobeTopCenter, lobeBotCenter, upperHoleCenter,
      lowerHubCenter, midHoleCenter, r1375Center, r1750Center, rightArmCenter,
    }
  }, 'layout-centers')

  await snapshot('layout-v1')
  return { partId }
}
