export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TransformAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Arrow' })).result
  await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 10, height: 10 })
  await api.v1.part.cone({ id: tplId, name: 'Head', height: 20, bDiameter: 20, tDiameter: 0, translation: [60, 5, 5], rotation: [0, Math.PI / 2, 0] })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Default (no transformation) — should be at origin
  const r1 = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Default' })
  console.log('[03] default (no transform):', r1.result, 'maxLevel:', r1.maxLevel)

  // 3-point format: [origin, xDirection, yDirection]
  const r2 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'ThreePoint',
    transformation: [[0, 40, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[03] 3-point offset y=40:', r2.result)

  // 3-point format with rotation (90° around Z: x→y, y→-x)
  const r3 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Rotated90Z',
    transformation: [[0, 80, 0], [0, 1, 0], [-1, 0, 0]],
  })
  console.log('[03] 3-point rotated 90°Z:', r3.result)

  // 4x4 matrix format — translate by [0, 120, 0]
  const r4 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Matrix4x4',
    transformation: [
      [1, 0, 0, 0],
      [0, 1, 0, 120],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[03] 4x4 matrix offset y=120:', r4.result)

  // 4x4 matrix with rotation (45° around Z)
  const c = Math.cos(Math.PI / 4)
  const s = Math.sin(Math.PI / 4)
  const r5 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Matrix45Z',
    transformation: [
      [c, -s, 0, 0],
      [s, c, 0, 160],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[03] 4x4 45°Z at y=160:', r5.result)

  await snapshot('transform-formats')
  return { asmId, tplId }
}
