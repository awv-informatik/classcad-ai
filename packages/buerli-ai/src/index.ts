// ─── Public API ───────────────────────────────────────────────────────────────

// Factory
export { createCadAgent } from './factory'
export type { CreateCadAgentOptions, CadAgent, CadAgentPanelProps } from './factory'
export type { AgentPanelTheme } from './AgentPanel'

// Providers
export { createAnthropicProvider } from './provider'
export type { AnthropicProviderConfig } from './provider'
export { createOpenAIProvider } from './provider-openai'
export type { OpenAIProviderConfig } from './provider-openai'
export { createResponsesProvider } from './provider-responses'
export type { ResponsesProviderConfig } from './provider-responses'
export { createCopilotProvider } from './provider-copilot'
export type { CopilotProviderConfig } from './provider-copilot'
export { createAutoProvider } from './provider-auto'
export type { AutoProviderConfig } from './provider-auto'

// Init
export { initAgent, initAgentAsync } from './init'

// Store (for custom UIs)
export { createAgentStore } from './store'
export type { AgentStore, AgentStoreState, UIMessage, CodeEvent } from './store'

// Agent loop (for headless usage)
export { runAgentLoop } from './agentLoop'
export type { AgentTurnEvent } from './agentLoop'

// Types
export type {
  AgentConfig,
  LLMProvider,
  ChatParams,
  ChatResponse,
  Message,
  ContentBlock,
  McpToolSchema,
  ReasoningEffort,
  ModelOption,
  ProviderCapabilities,
  ImageInput,
  FileAttachment,
} from './types'

// System prompt
export { DEFAULT_SYSTEM_PROMPT } from './systemPrompt'

// Tools (low-level — for custom executors or testing)
export { TOOL_SCHEMAS, executeTool } from './tools'
export type { MethodRegistry, RegistryEntry, SkillBundle } from './tools'

