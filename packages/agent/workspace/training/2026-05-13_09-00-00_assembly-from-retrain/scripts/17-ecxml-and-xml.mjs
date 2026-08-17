// 17 — ECXML/XML formats. Per 2026-05-09 finding, <assembly> hangs the worker.
// Try a minimal safe ECXML root and see what's accepted.
export default async function (api, { filewrite }) {
  // A: bare ecxml root (per prev session, returns "not implemented" warning)
  const a = await api.v1.assembly.from({
    data: '<?xml version="1.0"?><ecxml/>',
    format: 'ECXML',
  })
  console.log('[17 A] ecxml maxLevel:', a.maxLevel)
  console.log('[17 A] msgs:', JSON.stringify(a.messages?.slice(0, 3)))

  await api.v1.common.clear({})

  // B: XML format with bare root
  const b = await api.v1.assembly.from({ data: '<?xml version="1.0"?><root/>', format: 'XML' })
  console.log('[17 B] xml maxLevel:', b.maxLevel)
  console.log('[17 B] msgs:', JSON.stringify(b.messages?.slice(0, 3)))

  await api.v1.common.clear({})

  // C: Try ECXML with possible-real element types (NO <assembly> — that hangs)
  // Use names mirroring CC_AssemblyRoot
  const c = await api.v1.assembly.from({
    data: '<?xml version="1.0"?><CC_AssemblyRoot name="Test"/>',
    format: 'ECXML',
  })
  console.log('[17 C] CC_AssemblyRoot maxLevel:', c.maxLevel)
  console.log('[17 C] msgs:', JSON.stringify(c.messages?.slice(0, 3)))

  filewrite({ a: a.messages, b: b.messages, c: c.messages }, 'all-messages')
  return {}
}
