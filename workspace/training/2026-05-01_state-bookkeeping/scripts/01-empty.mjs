/**
 * 01-empty.mjs — after a fresh connection, tree() should return the empty/root state.
 *
 * The previous run.mjs always issues `v1.common.clear` before disconnect, so on
 * reconnect we expect a single root node `AllObjects`.
 */

export default async function (api, { tree, filewrite }) {
  // Issue any call so structure arrives in the cache.
  await api.v1.common.getAppVersion({})

  const t = await tree()
  filewrite(t, 'tree-empty')

  const nodes = Object.values(t.tree)
  const ok = nodes.length === 1 && nodes[0].class === 'AllObjects'
  console.log(`[01] empty tree: ${ok ? '✓' : '❌'} (${nodes.length} node, class=${nodes[0]?.class})`)
}
