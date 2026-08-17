// 02 — confirm the renderer draws MINOR arcs regardless of true geometry.
// Build the true INTERSECTION (keep inner arcs; bulge should be ~0.49 minor). If its render matches case 01's
// (which was actually the major-arc UNION), the renderer ignores bulge/major-arc.
import { makeSketch, circle, positions } from './_setup.mjs'
import { classify, INSIDE_ONLY } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const C1 = await circle(api, skId, [0, 0, 0], 50)
  const C2 = await circle(api, skId, [60, 0, 0], 50)
  const srcMap = { [C1]: { type: 'circle', c: [0, 0], r: 50 }, [C2]: { type: 'circle', c: [60, 0], r: 50 } }
  const shapes = [{ kind: 'circle', c: [0, 0], r: 50 }, { kind: 'circle', c: [60, 0], r: 50 }]

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const { rows, keep, trim } = await classify(api, pre.result, srcMap, shapes, { keepRule: INSIDE_ONLY })
  console.log('[02] INTERSECTION rule: keep(inner)', keep, 'trim(outer)', trim)
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  const rPost = await api.v1.sketch.postTrim({ id: skId })
  await snapshot('02-intersection')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const tree = rPost.structure?.tree
  const bulges = (geo.arcs || []).map(id => ({ id, bulge: tree?.[id]?.members?.bulge?.value, radius: tree?.[id]?.members?.radius?.value }))
  filewrite({ keep, trim, bulges }, '02-intersection')
  console.log('[02] survivor arc bulges (minor => ~0.49):', JSON.stringify(bulges))
  // angle from bulge: theta = 4*atan(|bulge|)
  for (const b of bulges) console.log(`[02] arc ${b.id} bulge ${b.bulge?.toFixed(3)} -> angle ${(4 * Math.atan(Math.abs(b.bulge)) * 180 / Math.PI).toFixed(1)} deg`)
  return { bulges }
}
