// 05 — Explore facetingParamsMode: what does mode 0 vs mode 1 do?
// mode 0 = "default parameters will be used"
// mode 1 = "specific parameters of each entity will be used"
export default async function (api, { filewrite }) {
  // Check current mode
  const initial = (await api.v1.common.getDatabaseSettings()).result
  console.log('[05] Initial facetingParamsMode:', initial.facetingParamsMode)

  // Switch to mode 0
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
  const mode0 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[05] After mode=0: facetingParamsMode:', mode0.facetingParamsMode)

  // Switch to mode 1
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 1 })
  const mode1 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[05] After mode=1: facetingParamsMode:', mode1.facetingParamsMode)

  // Try mode 2 (invalid?)
  const r = await api.v1.common.setDatabaseSettings({ facetingParamsMode: 2 })
  console.log('[05] mode=2 maxLevel:', r.maxLevel, 'messages:', JSON.stringify(r.messages))
  const mode2 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[05] After mode=2: facetingParamsMode:', mode2.facetingParamsMode)

  filewrite({ initial, mode0, mode1, mode2, mode2Response: { maxLevel: r.maxLevel, messages: r.messages } }, 'faceting-modes')

  return { initial, mode0, mode1, mode2 }
}
