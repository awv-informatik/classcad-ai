export default async function (api, { snapshot, filewrite }) {
  // Setup: revolute joint with limits
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Wcs', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Arm', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Wcs', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })
  await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })

  // Pattern A: animate in one session with increasing angles
  const angles = [0, 30, 60, 90, 120]
  const cogsA = []

  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst2], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })

  for (const deg of angles) {
    const rad = deg * Math.PI / 180
    const c = Math.cos(rad)
    const s = Math.sin(rad)
    await api.v1.assembly.moveUnderConstraints({
      id: asmId,
      rotation: { xDir: [c, -s, 0], yDir: [s, c, 0], zDir: [0, 0, 1] },
    })
    const m = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
    cogsA.push({ deg, cog: m.cog })
    console.log(`[02] pattern A: ${deg}° → COG:`, m.cog)
  }

  // Finish at 120°
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('at-120-degrees')

  // Pattern B: animate via separate sessions
  // Reset to 0° first by doing a new session
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst2], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [1, 0, 0], yDir: [0, 1, 0], zDir: [0, 0, 1] },
  })
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  const massReset = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[02] after reset to 0°:', massReset.cog)

  // Now try multi-session: 30° → finish → 60° → finish
  // Session 1: 30°
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst2], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  const rad30 = 30 * Math.PI / 180
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [Math.cos(rad30), -Math.sin(rad30), 0], yDir: [Math.sin(rad30), Math.cos(rad30), 0], zDir: [0, 0, 1] },
  })
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  const massAt30 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[02] session1 at 30°:', massAt30.cog)

  // Session 2: try 30° again (from the already-30° position)
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst2], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [Math.cos(rad30), -Math.sin(rad30), 0], yDir: [Math.sin(rad30), Math.cos(rad30), 0], zDir: [0, 0, 1] },
  })
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  const massAt30Again = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[02] session2 at 30° again (should be 30° not 60°):', massAt30Again.cog)

  // Session 3: explicit 60° from zero
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst2], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  const rad60 = 60 * Math.PI / 180
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [Math.cos(rad60), -Math.sin(rad60), 0], yDir: [Math.sin(rad60), Math.cos(rad60), 0], zDir: [0, 0, 1] },
  })
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  const massAt60 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[02] session3 at 60° explicit:', massAt60.cog)

  filewrite({
    patternA_singleSession: cogsA,
    reset: massReset.cog,
    session1_30: massAt30.cog,
    session2_30again: massAt30Again.cog,
    session3_60explicit: massAt60.cog,
    session2MatchesSession1: JSON.stringify(massAt30.cog) === JSON.stringify(massAt30Again.cog),
  }, 'animate-pattern')

  return { inst2 }
}
