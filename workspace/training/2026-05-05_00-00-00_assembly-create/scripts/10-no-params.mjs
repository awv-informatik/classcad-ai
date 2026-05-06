export default async function (api, { filewrite }) {
  // Test: call assembly.create with no params at all (undefined/empty)
  const r = await api.v1.assembly.create()
  console.log('[10] no-params result:', r.result, 'maxLevel:', r.maxLevel)

  // Check the default name
  filewrite(r.structure, 'no-params-structure')

  // Extract the assembly node name
  const tree = r.structure?.tree
  if (tree && tree[r.result]) {
    console.log('[10] default name:', tree[r.result].name)
  }

  return { asmId: r.result }
}
