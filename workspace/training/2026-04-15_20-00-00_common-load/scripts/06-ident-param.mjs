// Test ident parameter — custom identifier for loaded root product
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IdentTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const saved = await api.v1.common.save({
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })

  // Load with custom ident
  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
    ident: 'MyCustomIdent',
  })
  console.log('[06] Load with ident result:', JSON.stringify(loadR.result))
  console.log('[06] Load with ident maxLevel:', loadR.maxLevel)

  filewrite({ result: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages }, 'ident-response')

  // Check if the ident affected the loaded product name
  // Use structure to look at the root product
  filewrite(loadR.structure, 'ident-structure')

  await snapshot('after-ident-load')

  return { loadedId: loadR.result?.id }
}
