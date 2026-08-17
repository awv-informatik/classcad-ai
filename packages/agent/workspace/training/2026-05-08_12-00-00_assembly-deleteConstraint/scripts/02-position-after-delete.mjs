export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Ground inst1
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcs },
  })

  // Fasten inst2 at xOffset=80
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'Joint',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 80,
  })).result

  // Measure before delete using getInstance and calculateMassProperties
  const instBefore = (await api.v1.assembly.getInstance({ id: asmId, name: 'B' })).result
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[02] getInstance before:', JSON.stringify(instBefore))
  console.log('[02] massProp before:', JSON.stringify(massBefore))
  filewrite({ getInstance: instBefore, massProp: massBefore }, 'before-delete')

  await snapshot('before')

  // Delete fastened constraint
  const delR = await api.v1.assembly.deleteConstraint({ ids: [fId] })
  console.log('[02] delete result:', delR.result, 'maxLevel:', delR.maxLevel)

  // Measure after delete
  const instAfter = (await api.v1.assembly.getInstance({ id: asmId, name: 'B' })).result
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[02] getInstance after:', JSON.stringify(instAfter))
  console.log('[02] massProp after:', JSON.stringify(massAfter))
  filewrite({ getInstance: instAfter, massProp: massAfter }, 'after-delete')

  await snapshot('after')

  return { asmId }
}
