import type { Graphic, ScriptSession, Tree } from './types.js'
export interface InspectionCapture { tree: Tree; graphic: Graphic | null; revision: number | null; capturedAt: string }
/** Capture current geometry without regeneration. Revision is client-local, not persistent topology identity. */
export async function captureInspection(session: ScriptSession & { readonly version?: number }): Promise<InspectionCapture> {
  const graphic = await session.getGraphic({ recalc: false })
  const revision = session.version ?? null
  const tree = await session.getTree()
  if (revision !== null && session.version !== revision) throw new Error('Model changed during inspection; recapture when idle')
  return { tree, graphic, revision, capturedAt: new Date().toISOString() }
}
export function currentSolids(capture: InspectionCapture): number[] {
  return Object.values(capture.tree).filter(n => n.class === 'CC_Solid' && n.members?.consumed?.value === 0).map(n => n.id)
}
/** Approximate bounds of tessellated points; no assembly instance transforms are applied. */
export function graphicBounds(capture: InspectionCapture, owners?: number[]) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  let points = 0
  for (const c of capture.graphic?.containers ?? []) {
    if (owners && !owners.includes(c.owner)) continue
    for (const coords of [...(c.meshes ?? []).map(m => m.vertices), ...(c.edges ?? []).map(e => e.points)]) {
      for (let i = 0; i + 2 < coords.length; i += 3) {
        if (!coords.slice(i, i + 3).every(Number.isFinite)) continue
        for (let j = 0; j < 3; j++) { min[j] = Math.min(min[j], coords[i+j]); max[j] = Math.max(max[j], coords[i+j]) }
        points++
      }
    }
  }
  return { min: points ? min : null, max: points ? max : null, approximate: true,
    coordinateSpace: 'graphic coordinates; instance transforms not applied', revision: capture.revision }
}
export function edgeCandidates(capture: InspectionCapture, point: [number, number, number], tolerance: number, owners?: number[]) {
  if (!Number.isFinite(tolerance) || tolerance < 0 || !point.every(Number.isFinite)) throw new Error('Finite point and nonnegative tolerance required')
  const candidates: Array<{ id: number; owner: number; distance: number }> = []
  for (const c of capture.graphic?.containers ?? []) {
    if (owners && !owners.includes(c.owner)) continue
    for (const edge of c.edges ?? []) {
      let distance = Infinity
      for (let i = 0; i + 5 < edge.points.length; i += 3) {
        const a = edge.points.slice(i,i+3), v = a.map((x,j) => edge.points[i+3+j]-x)
        const den = v.reduce((s,x)=>s+x*x,0)
        const t = den ? Math.max(0,Math.min(1,v.reduce((s,x,j)=>s+x*(point[j]-a[j]),0)/den)) : 0
        distance = Math.min(distance,Math.hypot(...a.map((x,j)=>point[j]-x-t*v[j])))
      }
      if (distance <= tolerance) candidates.push({id:edge.id,owner:c.owner,distance})
    }
  }
  return { candidates: candidates.sort((a,b)=>a.distance-b.distance), tolerance, revision: capture.revision,
    referenceScope: 'this capture only; recapture after model changes' }
}
export function uniqueEdge(...args: Parameters<typeof edgeCandidates>) {
  const result = edgeCandidates(...args)
  if (result.candidates.length !== 1) throw new Error(`Expected one edge, found ${result.candidates.length}; narrow owner/point/tolerance`)
  return { ...result.candidates[0], revision: result.revision }
}
export async function inspectSolid(session: ScriptSession, id: number) {
  const capture = await captureInspection(session)
  if (!currentSolids(capture).includes(id)) throw new Error('Requested id is not a current unconsumed solid')
  const mass = await session.execute({ 'v1.part.calculateMassProperties': [{ id }] })
  if ((mass.maxLevel ?? 0) >= 51) throw new Error('Mass calculation failed: ' + JSON.stringify(mass.messages))
  return { id, mass: mass.result, bounds: graphicBounds(capture,[id]), revision: capture.revision,
    validity: 'not checked; mass and graphics are not a B-rep validity test' }
}
