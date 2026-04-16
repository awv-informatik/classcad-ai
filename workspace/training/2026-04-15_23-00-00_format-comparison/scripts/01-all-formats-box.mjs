// Test all save formats on a simple box geometry
// Measure: output size, success, content characteristics
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FormatTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })
  await snapshot('box')

  const formats = ['OFB', 'STP', 'STL', 'SCG', 'IWP']
  const results = {}

  for (const fmt of formats) {
    try {
      const r = await api.v1.common.save({ format: fmt, encoding: 'base64' })
      results[fmt] = {
        success: r.result?.success,
        contentLength: r.result?.content?.length || 0,
        maxLevel: r.maxLevel,
        messageCount: r.messages?.length || 0,
      }
      console.log(`[01] ${fmt}: success=${r.result?.success}, b64len=${r.result?.content?.length || 0}, maxLevel=${r.maxLevel}`)
    } catch (e) {
      results[fmt] = { error: e.message }
      console.log(`[01] ${fmt}: ERROR — ${e.message}`)
    }
  }

  // Also test DXF
  try {
    const r = await api.v1.common.save({ format: 'DXF', encoding: 'base64' })
    results['DXF'] = {
      success: r.result?.success,
      contentLength: r.result?.content?.length || 0,
      maxLevel: r.maxLevel,
      messages: r.messages?.map(m => m.message),
    }
    console.log(`[01] DXF: success=${r.result?.success}, b64len=${r.result?.content?.length || 0}, maxLevel=${r.maxLevel}`)
  } catch (e) {
    results['DXF'] = { error: e.message }
    console.log(`[01] DXF: ERROR — ${e.message}`)
  }

  // Test OFB with deflate+base64
  try {
    const r = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
    results['OFB_deflate'] = {
      success: r.result?.success,
      contentLength: r.result?.content?.length || 0,
      maxLevel: r.maxLevel,
    }
    console.log(`[01] OFB+deflate: success=${r.result?.success}, b64len=${r.result?.content?.length || 0}`)
  } catch (e) {
    results['OFB_deflate'] = { error: e.message }
    console.log(`[01] OFB+deflate: ERROR — ${e.message}`)
  }

  // IWP binary mode
  try {
    const r = await api.v1.common.save({ format: 'IWP', encoding: 'base64', iwp: { binary: 1 } })
    results['IWP_binary'] = {
      success: r.result?.success,
      contentLength: r.result?.content?.length || 0,
      maxLevel: r.maxLevel,
    }
    console.log(`[01] IWP+binary: success=${r.result?.success}, b64len=${r.result?.content?.length || 0}`)
  } catch (e) {
    results['IWP_binary'] = { error: e.message }
    console.log(`[01] IWP+binary: ERROR — ${e.message}`)
  }

  filewrite(results, 'all-formats')
  return { partId }
}
