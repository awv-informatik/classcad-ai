// Q: 4x4 matrix layout — where is translation? Row-major or column-major?
// The docs show translation in the last column: [[1,0,0,tx],[0,1,0,ty],[0,0,1,tz],[0,0,0,1]]
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box at origin
  const boxId = (await api.v1.part.box({ id: partId, xLen: 40, yLen: 40, zLen: 40 })).result

  await snapshot('before-transform')

  // 1. Pure translation: move [100, 0, 0] — translation in last column
  const r1 = await api.v1.common.transformObjectWithMatrix({
      id: partId,
      matrix: [
        [1, 0, 0, 100],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ]
    })
  console.log('[04] translate [100,0,0] (col format):', r1.maxLevel <= 31 ? '✓' : '❌')

  await snapshot('after-translate-100x')

  // 2. Now try translation in bottom row instead (row-major convention test)
  // Reset first
  await api.v1.common.clear({})
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result
  await api.v1.part.box({ id: partId2, xLen: 40, yLen: 40, zLen: 40 })

  const r2 = await api.v1.common.transformObjectWithMatrix({
      id: partId2,
      matrix: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [100, 0, 0, 1]
      ]
    })
  console.log('[04] translate bottom row:', r2.maxLevel <= 31 ? '✓' : '❌')

  await snapshot('after-translate-bottom-row')

  // 3. 90° rotation around Z axis — standard rotation matrix
  await api.v1.common.clear({})
  const partId3 = (await api.v1.part.create({ name: 'Test3' })).result
  await api.v1.part.box({ id: partId3, xLen: 80, yLen: 20, zLen: 20 })

  await snapshot('before-rotate')

  const cos90 = Math.cos(Math.PI / 2)
  const sin90 = Math.sin(Math.PI / 2)
  const r3 = await api.v1.common.transformObjectWithMatrix({
      id: partId3,
      matrix: [
        [cos90, -sin90, 0, 0],
        [sin90, cos90, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ]
    })
  console.log('[04] rotate 90° Z:', r3.maxLevel <= 31 ? '✓' : '❌')

  await snapshot('after-rotate-90z')

  // 4. Non-square matrix — what happens?
  const r4 = await api.v1.common.transformObjectWithMatrix({
      id: partId3,
      matrix: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]
    })
  console.log('[04] 3x3 matrix:', r4.maxLevel <= 31 ? '✓' : '❌')
  if (r4.maxLevel > 31) console.log('[04] 3x3 error:', r4.messages.map(m => m.message).join('; '))

  // 5. isGlobal parameter — test FALSE
  const r5 = await api.v1.common.transformObjectWithMatrix({
      id: partId3,
      matrix: [
        [1, 0, 0, 50],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ],
      isGlobal: 0  // FALSE
    })
  console.log('[04] isGlobal=FALSE:', r5.maxLevel <= 31 ? '✓' : '❌')

  await snapshot('after-local-translate')

  return { partId3 }
}
