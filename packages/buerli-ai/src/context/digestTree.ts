// ─── Model digest — what exists in the drawing, read from the engine ──────────
//
// The drawing is the agent's real memory: tree ids are stable for the session
// and the structure can be re-read at any time. So "what have we built so far"
// is never summarized from the conversation — it is generated from ground truth,
// which also corrects whatever the model believes it built.
//
// Pure function over the buerli structure tree (see @classcad/script docs/STRUCTURE.md).

import { isSheet, isSolid } from '../bodies'
import type { DrawingStructure, StructureNode } from '../types'

type Tree = Record<string, StructureNode>

const PRODUCT_CLASSES = new Set(['CC_Part', 'CC_Assembly', 'CC_AssemblyRoot'])
const DEFAULT_GEOMETRY = new Set(['Origin', 'XAxis', 'YAxis', 'ZAxis', 'Top', 'Front', 'Right'])

const node = (tree: Tree, id: unknown): StructureNode | undefined => (id == null ? undefined : tree[String(id)])

const childrenOf = (tree: Tree, n: StructureNode | undefined): StructureNode[] =>
  (n?.children ?? []).map((id) => node(tree, id)).filter((c): c is StructureNode => !!c)

const childOfClass = (tree: Tree, n: StructureNode | undefined, cls: string): StructureNode | undefined =>
  childrenOf(tree, n).find((c) => c.class === cls)

const label = (n: StructureNode): string => `#${n.id} ${String(n.class ?? '?').replace(/^CC_/, '')} "${n.name ?? ''}"`

const fmtValue = (v: unknown): string => {
  if (typeof v === 'number') return String(Math.round(v * 1e6) / 1e6)
  if (v == null) return 'null'
  return typeof v === 'string' ? v : (JSON.stringify(v) ?? '')
}

function expressionsOf(tree: Tree, product: StructureNode, max: number): string[] {
  const set = childOfClass(tree, product, 'CC_ExpressionSet')
  const members = Object.entries(set?.members ?? {}).filter(([name]) => !name.startsWith('_'))
  const lines = members.slice(0, max).map(([name, m]) => `${name} = ${m?.expression ? `${m.expression} (${fmtValue(m.value)})` : fmtValue(m?.value)}`)
  if (members.length > max) lines.push(`… +${members.length - max} more`)
  return lines
}

function featuresOf(tree: Tree, product: StructureNode, max: number): { lines: string[]; rolledBack: boolean } {
  const seq = childOfClass(tree, product, 'CC_OperationSequence')
  const steps = childrenOf(tree, seq)
  const barIndex = steps.findIndex((s) => s.class === 'CC_RollbackBar')
  const rolledBack = barIndex >= 0 && barIndex < steps.length - 1
  const features: string[] = []
  steps.forEach((step, i) => {
    if (step.class === 'CC_RollbackBar') return
    const target = node(tree, step.members?.refObj?.value)
    if (!target) return
    if (DEFAULT_GEOMETRY.has(String(target.name)) && String(target.class).startsWith('CC_Work')) return // present in every part
    features.push(`${label(target)}${barIndex >= 0 && i > barIndex ? ' (after the rollback bar: not built)' : ''}`)
  })
  // The most recent features matter most: keep the tail.
  const lines = features.length > max ? [`… ${features.length - max} earlier features omitted`, ...features.slice(-max)] : features
  return { lines, rolledBack }
}

function bodiesOf(tree: Tree, product: StructureNode): { solids: number; sheets: number } {
  // Current bodies of THIS product, solids and sheets (open bodies) apart:
  // consumed === 0 and a parent chain that reaches the product.
  const count = { solids: 0, sheets: 0 }
  for (const n of Object.values(tree)) {
    const kind = isSolid(n) ? 'solids' : isSheet(n) ? 'sheets' : null
    if (!kind || n.members?.consumed?.value !== 0) continue
    let p: StructureNode | undefined = n
    for (let guard = 0; p && guard < 64; guard++) {
      if (p.id === product.id) {
        count[kind]++
        break
      }
      p = node(tree, p.parent)
    }
  }
  return count
}

function sketchesOf(tree: Tree, product: StructureNode, max: number): string[] {
  const set = childOfClass(tree, product, 'CC_SketchSet')
  const sketches = childrenOf(tree, set)
  const lines = sketches.slice(-max).map((s) => {
    const kids = childrenOf(tree, s)
    const constraints = kids.filter((k) => String(k.class ?? '').includes('Constraint')).length
    return `#${s.id} "${s.name ?? ''}" (${kids.length - constraints} curves, ${constraints} constraints)`
  })
  if (sketches.length > max) lines.unshift(`… ${sketches.length - max} earlier sketches omitted`)
  return lines
}

function assemblyOf(tree: Tree, product: StructureNode, max: number): string[] {
  const lines: string[] = []
  const instances = childrenOf(tree, product).filter((c) => String(c.class ?? '').startsWith('CC_ProductReference'))
  if (instances.length) {
    lines.push(`instances (${instances.length}):`)
    for (const inst of instances.slice(0, max)) {
      const template = node(tree, inst.members?.productId?.value ?? inst.link)
      lines.push(`  #${inst.id} "${inst.name ?? ''}" → ${template ? `#${template.id} "${template.name ?? ''}"` : '?'}`)
    }
    if (instances.length > max) lines.push(`  … +${instances.length - max} more`)
  }
  const constraints = childrenOf(tree, childOfClass(tree, product, 'CC_ConstraintSet'))
  if (constraints.length) {
    lines.push(`constraints (${constraints.length}):`)
    for (const c of constraints.slice(0, max)) lines.push(`  ${label(c)}`)
    if (constraints.length > max) lines.push(`  … +${constraints.length - max} more`)
  }
  return lines
}

/**
 * Compact, ground-truth description of the drawing. Trims itself to `maxChars`
 * (sketch detail first, then older features, then expressions).
 */
export function digestTree(structure: DrawingStructure | null | undefined, opts: { maxChars?: number } = {}): string {
  const maxChars = opts.maxChars ?? 3000
  const tree = (structure?.tree ?? null) as Tree | null
  if (!tree || Object.keys(tree).length === 0) return 'The drawing is empty.'
  const products = Object.values(tree).filter((n) => PRODUCT_CLASSES.has(String(n.class)))
  if (!products.length) return 'The drawing holds no part or assembly yet.'

  const build = (maxFeatures: number, maxExpr: number, maxSketches: number): string => {
    const out: string[] = []
    for (const p of products) {
      const marks = [String(structure?.root) === String(p.id) ? 'root' : '', String(structure?.currentProduct) === String(p.id) ? 'current' : ''].filter(Boolean)
      out.push(`${label(p)}${marks.length ? ` [${marks.join(', ')}]` : ''}`)
      if (p.class === 'CC_Part') {
        const { lines, rolledBack } = featuresOf(tree, p, maxFeatures)
        if (rolledBack) out.push('  ! history is rolled back: features after the rollback bar are not built')
        if (lines.length) out.push('  features, in build order:', ...lines.map((l) => `    ${l}`))
        const { solids, sheets } = bodiesOf(tree, p)
        if (solids || sheets) out.push(`  current solids: ${solids}${sheets ? `, sheets (open bodies): ${sheets}` : ''}`)
        if (maxSketches > 0) {
          const sk = sketchesOf(tree, p, maxSketches)
          if (sk.length) out.push('  sketches:', ...sk.map((l) => `    ${l}`))
        }
      } else {
        out.push(...assemblyOf(tree, p, maxFeatures).map((l) => `  ${l}`))
      }
      const expr = expressionsOf(tree, p, maxExpr)
      if (expr.length) out.push('  expressions:', ...expr.map((l) => `    ${l}`))
    }
    return out.join('\n')
  }

  for (const [f, e, s] of [[40, 40, 12], [40, 40, 0], [16, 24, 0], [8, 12, 0], [4, 6, 0]] as const) {
    const text = build(f, e, s)
    if (text.length <= maxChars) return text
  }
  return `${build(4, 6, 0).slice(0, maxChars - 60)}\n… (trimmed — use find/tree for more)`
}
