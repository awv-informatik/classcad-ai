// Type declarations for @classcad/skill/discovery.

export interface RegistryEntry {
  domain: string
  method: string
  summary?: string
  params?: Array<{ name: string; text: string }>
}
export type MethodRegistry = Record<string, RegistryEntry>

export interface SearchResult {
  count: number
  methods: string[] | Array<{ method: string; summary: string }>
  note?: string
}

export interface DescribeResult {
  kind: 'method' | 'doc' | 'error'
  text: string
}

export interface BulkDocsResult {
  /** The assembled tool result: `# ═══ key ═══` sections + a "not found" section. */
  text: string
  found: string[]
  missing: string[]
  /** Set when no valid keys were provided (text carries the usage hint). */
  empty?: boolean
}

/** Per-key resolver override for hosts with extra key spaces (live namespaces …). */
export type ResolveOne = (key: string) => Promise<{ text?: string; error?: string } | null | undefined>

export interface Discovery {
  searchMethods(opts?: {
    domain?: string
    search?: string | string[]
    withSummaries?: boolean
    limit?: number
  }): SearchResult
  describeMethod(name: string): DescribeResult
  readDoc(name: string): { key: string; text: string } | null
  listDocs(): { topics: string[]; overviews: string[]; recipes: string[] }
  methodIndex(): string
  /** Bulk documentation — the single source for every host's `docs` tool. */
  bulkDocs(keys: unknown, resolveOne?: ResolveOne): Promise<BulkDocsResult>
}

/** Shared limits for the bulk docs tool. */
export const DOCS_MAX_KEYS: number
export const DOCS_PER_DOC_CAP: number

/** Shared `docs` tool contract (name + LLM-facing description). */
export const DOCS_TOOL: { name: string; description: string }

export function createDiscovery(opts?: {
  registry?: MethodRegistry
  bundle?: Record<string, string>
  extraDocs?: Record<string, string>
  resolveDoc?: (key: string) => string | null
}): Discovery

export default createDiscovery
