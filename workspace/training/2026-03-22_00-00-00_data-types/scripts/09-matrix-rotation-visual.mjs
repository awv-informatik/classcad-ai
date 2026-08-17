// Q: Verify matrix rotation works with standard math convention (column-format)
// Use a very asymmetric box so rotation is clearly visible
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Very asymmetric box: long in X, thin in Y and Z
  await api.v1.part.box({ id: partId, xLen: 100, yLen: 10, zLen: 10 })
  await snapshot('before-45deg')

  // 45° rotation around Z axis (standard math: cos/sin in top-left 2x2)
  const c = Math.cos(Math.PI / 4)
  const s = Math.sin(Math.PI / 4)
  await api.v1.common.transformObjectWithMatrix({
      id: partId,
      matrix: [
        [c, -s, 0, 0],
        [s, c, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ]
    })
  await snapshot('after-45deg-z')

  // Now also test: does the matrix compose? Apply another 45° (total 90°)
  await api.v1.common.transformObjectWithMatrix({
      id: partId,
      matrix: [
        [c, -s, 0, 0],
        [s, c, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ]
    })
  await snapshot('after-90deg-z')

  return { partId }
}
