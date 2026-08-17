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
}

export function createDiscovery(opts?: {
  registry?: MethodRegistry
  bundle?: Record<string, string>
  extraDocs?: Record<string, string>
  resolveDoc?: (key: string) => string | null
}): Discovery

export default createDiscovery
