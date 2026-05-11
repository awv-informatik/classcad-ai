export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Test reorient with free rotation (should be invisible since DOF absorbs it)
  const reorients = ['0', '90', '180', '270']
  const cogsFree = {}

  for (const reorient of reorients) {
    const inst = (await api.v1.assembly.instance({
      productId: tplB, ownerId: asmId, name: `Arm-free-${reorient}`,
      transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]]
    })).result

    await api.v1.assembly.cylindrical({
      id: asmId,
      name: `Cyl-free-${reorient}`,
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst], csys: wcsB, reorient },
      zOffsetLimits: { min: 20, max: 20 }
    })

    const cog = (await api.v1.part.calculateMassProperties({ id: inst })).result?.cog
    console.log(`[06] reorient=${reorient} (free rotation): COG=${JSON.stringify(cog)}`)
    cogsFree[reorient] = cog

    await api.v1.assembly.deleteConstraint({
      id: (await api.v1.assembly.getCylindrical({ id: asmId, name: `Cyl-free-${reorient}` })).result?.id
    })
    await api.v1.assembly.deleteInstance({ id: inst })
  }

  // Test reorient with locked rotation (should show visible rotation)
  const cogsLocked = {}

  for (const reorient of reorients) {
    const inst = (await api.v1.assembly.instance({
      productId: tplB, ownerId: asmId, name: `Arm-locked-${reorient}`,
      transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]]
    })).result

    await api.v1.assembly.cylindrical({
      id: asmId,
      name: `Cyl-locked-${reorient}`,
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst], csys: wcsB, reorient },
      zOffsetLimits: { min: 20, max: 20 },
      zRotationLimits: { min: 0, max: 0 }
    })

    const cog = (await api.v1.part.calculateMassProperties({ id: inst })).result?.cog
    console.log(`[06] reorient=${reorient} (locked): COG=${JSON.stringify(cog)}`)
    cogsLocked[reorient] = cog

    await api.v1.assembly.deleteConstraint({
      id: (await api.v1.assembly.getCylindrical({ id: asmId, name: `Cyl-locked-${reorient}` })).result?.id
    })
    await api.v1.assembly.deleteInstance({ id: inst })
  }

  filewrite({ cogsFree, cogsLocked }, 'reorient-cogs')

  return { asmId }
}
