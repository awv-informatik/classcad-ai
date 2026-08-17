export default async function (api, { filewrite }) {
  // Create fresh assembly — nothing else
  const asmId = (await api.v1.assembly.create({ name: 'EmptyRoot' })).result
  console.log('[05] created empty assembly:', asmId)

  // Try converting immediately (no templates, no instances)
  const r = await api.v1.assembly.convertToTemplate({ name: 'EmptySub' })
  console.log('[05] convertToTemplate result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[05] messages:', JSON.stringify(r.messages))

  // Check if a new root was created
  const newRoot = r.structure?.root
  console.log('[05] new root:', newRoot)

  // Try to find the template
  const tpl = (await api.v1.assembly.getAssemblyTemplate({ name: 'EmptySub' })).result
  console.log('[05] template found:', tpl)

  filewrite({
    asmId,
    result: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
    newRoot,
    templateFound: tpl,
  }, 'empty-assembly')

  return { asmId }
}
