// Type declarations for @classcad/skill/discovery.

export interface RegistryEntry {
  domain: string
  method: string
  summary?: string
  params?: Array<{ name: string; text: string }>
  /** The @deprecated tag's text ("Use preTrim instead. …") — set only on deprecated methods. */
  deprecated?: string
}
export type MethodRegistry = Record<string, RegistryEntry>

export type MethodListing = string[] | Array<{ method: string; summary?: string; seeAbove?: string }>

export interface SearchResult {
  /** Matching methods (unique across groups). */
  count: number
  /** Full listing or a single-query search. */
  methods?: MethodListing
  /** Array search with 2+ entries: one group per entry. `seeAbove` = already listed under that entry. */
  groups?: Array<{ search: string; count: number; methods: MethodListing; note?: string }>
  note?: string
}

export interface DescribeResult {
  kind: 'method' | 'doc' | 'error'
  text: string
}

export interface BulkDocsResult {
  /**
   * The assembled tool result, at most `budget` chars: an optional "response budget reached"
   * header naming the deferred keys, `# ═══ key ═══` sections, and a "not found" section.
   */
  text: string
  /** Keys served (as requested, including `#page` suffixes). */
  found: string[]
  missing: string[]
  /** Valid keys that did not fit the budget — to be requested in a follow-up call. */
  deferred: string[]
  /** Set when no valid keys were provided (text carries the usage hint). */
  empty?: boolean
}

export interface DocSearchResult {
  count: number
  docs: Array<{ key: string; title: string; chars: number; pages: number; headings: string[] }>
  note?: string
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
  listDocs(): { topics: string[]; overviews: string[]; recipes: string[]; guides: string[] }
  /** Search recipes, topic docs and guides by topic (not per-method notes, not api/* overviews). */
  searchDocs(opts?: { search?: string | string[]; limit?: number; budget?: number }): DocSearchResult
  methodIndex(): string
  /** Compact `key — title` index of topic docs (DATA, STRUCTURE, GRAPHICS), recipes and guides. */
  docIndex(): string
  /** Bulk documentation — the single source for every host's `docs` tool. Size-budgeted, oversized docs paged. */
  bulkDocs(keys: unknown, resolveOne?: ResolveOne, opts?: { budget?: number }): Promise<BulkDocsResult>
}

/** Shared limits for the bulk docs tool. */
export const DOCS_MAX_KEYS: number
/** Max chars in one docs response. */
export const DOCS_RESPONSE_BUDGET: number
/** @deprecated Docs are paged, not truncated; equals DOCS_RESPONSE_BUDGET. */
export const DOCS_PER_DOC_CAP: number

/** Shared `docs` tool contract (name + LLM-facing description). */
export const DOCS_TOOL: { name: string; description: string }

/** Renamed/moved document keys → current key. */
export const DOC_ALIASES: Record<string, string>

/** The CAD synonym table behind both searches (read-only). */
export const SEARCH_SYNONYMS: Readonly<Record<string, readonly string[]>>

export function createDiscovery(opts?: {
  registry?: MethodRegistry
  bundle?: Record<string, string>
  extraDocs?: Record<string, string>
  resolveDoc?: (key: string) => string | null
}): Discovery

export default createDiscovery
