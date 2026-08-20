// 03 — does the local-coordinate flag semantics hold on Front and Right planes?
// Same canonical minor quarter arc in LOCAL coords on each plane (cw=false),
// extrude UP (along plane normal), read bulge + WORLD COG; check against the
// documented local→world mappings (Top: x,y | Front: u=+X,v=−Z | Right: u=+Z,v=−Y).
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Planes' })).result
  const partR = await api.v1.common.recalc()
  const planes = {}
  for (const n of Object.values(partR.structure.tree)) {
    if (n.class === 'CC_WorkPlane') planes[n.name] = n.id
  }
  console.log('[03] planes', JSON.stringify(planes))

  const H = 5
  // minor quarter segment, local COG ≈ (5.8380, 5.8380), mid-depth 2.5 along normal
  const uv = 5.83797
  const expected = {
    Top: { x: uv, y: uv, z: 2.5 },
    Front: { x: uv, y: 2.5, z: -uv }, // u=+X, v=−Z, normal +Y
    Right: { x: 2.5, y: -uv, z: uv }, // u=+Z→x? no: local u maps to world +Z, v to −Y; normal +X
  }

  const out = []
  for (const name of ['Top', 'Front', 'Right']) {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: planes[name] })).result
    const arc = (
      await api.v1.sketch.arcByCenter({
        id: skId,
        startPos: [10, 0, 0],
        endPos: [0, 10, 0],
        centerPos: [0, 0, 0],
        isClockwise: false,
        genFixation: false,
        genIncidence: false,
      })
    ).result
    const chord = (
      await api.v1.sketch.line({
        id: skId,
        startPos: [10, 0, 0],
        endPos: [0, 10, 0],
        genFixation: false,
        genIncidence: false,
        genVertAndHoriz: false,
      })
    ).result
    const rc = await api.v1.common.recalc()
    const bulge = rc.structure?.tree?.[String(arc)]?.members?.bulge?.value
    const ext = (await api.v1.part.extrusion({ id: partId, name: 'E' + name, references: [arc, chord], type: 'UP', limit2: H })).result
    const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
    const exp = expected[name]
    const cog = mp?.cog
    const match = cog && Math.abs(cog.x - exp.x) < 0.01 && Math.abs(cog.y - exp.y) < 0.01 && Math.abs(cog.z - exp.z) < 0.01
    out.push({ plane: name, arc, bulge, volume: mp?.volume, cog, expected: exp, match })
    console.log(
      '[03]',
      name,
      'bulge',
      bulge?.toFixed(5),
      'vol',
      mp?.volume?.toFixed(2),
      'cog',
      cog ? `${cog.x.toFixed(3)},${cog.y.toFixed(3)},${cog.z.toFixed(3)}` : null,
      'expected',
      `${exp.x},${exp.y},${exp.z}`,
      match ? '✓' : '❌',
    )
    if (ext) await api.v1.part.deleteFeature({ ids: [ext] })
    await api.v1.sketch.deleteObject({ ids: [arc, chord] })
  }
  filewrite(out, 'planes')
  return out
}
