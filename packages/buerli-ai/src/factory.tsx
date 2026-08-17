// ─── Factory — returns paired Panel + Canvas components ──────────────────────
//
// Usage:
//   const { AgentPanel, AgentCanvas } = createCadAgent({ provider })
//
//   <Canvas>
//     <AgentCanvas />       ← inside r3f Canvas, registers snapshot via useThree
//     {/* your scene */}
//   </Canvas>
//   <AgentPanel drawingId={drawingId} open={open} onClose={...} />

import React from 'react'
import type { DrawingID } from '@buerli.io/core'
import type { LLMProvider, ReasoningEffort } from './types'
import { AgentPanel as Panel, AgentPanelProps, AgentPanelTheme } from './AgentPanel'

export type CreateCadAgentOptions = {
  /** LLM provider instance. */
  provider: LLMProvider
  /** Max tool-use iterations. Default: 40 */
  maxIterations?: number
  /** Max tokens per LLM call. Default: 8192 */
  maxTokens?: number
  /** Override system prompt. */
  systemPrompt?: string
  /** Extra context appended to system prompt. */
  extraContext?: string
  /** Model name shown next to the context ring (e.g. "gpt-5.5"). */
  modelName?: string
  /** Context window size (prompt-token budget) — denominator for the context ring. */
  contextLimit?: number
  /**
   * Initial reasoning ("thinking") level. When set, a level picker appears in the
   * panel footer (between the model name and the context ring). Omit to hide it.
   */
  reasoningEffort?: ReasoningEffort
  /**
   * Force snapshot images to (true) / away from (false) the model. Default: derived
   * per selected model from its vision capability — override only when an endpoint
   * mis-reports (e.g. vision-capable but stalls on image inputs).
   */
  sendSnapshotsToModel?: boolean
}

export type CadAgent = {
  /** Chat panel component. Render outside the Canvas. */
  AgentPanel: React.FC<CadAgentPanelProps>
  /** Canvas-side component. Render inside <Canvas>. Registers snapshot capturer. */
  AgentCanvas: React.FC
}

export type CadAgentPanelProps = {
  drawingId: DrawingID
  open?: boolean
  onClose?: () => void
  position?: 'right' | 'left' | 'bottom'
  className?: string
  theme?: AgentPanelTheme
  /**
   * Per-mount extra context appended to the system prompt — overrides the
   * createCadAgent `extraContext` default. Lets one shared agent carry
   * app-specific knowledge per screen (e.g. a pipes-app prompt).
   */
  extraContext?: string
}

export function createCadAgent(options: CreateCadAgentOptions): CadAgent {
  const { provider, maxIterations, maxTokens, systemPrompt, extraContext, modelName, contextLimit, reasoningEffort, sendSnapshotsToModel } = options

  // ─── AgentCanvas — lives inside <Canvas>, captures via useThree ─────────

  /**
   * @deprecated The snapshot tool renders deterministically from session data
   * (@classcad/renderer) — no canvas capture needed. This component is now an
   * inert no-op kept so existing apps that render <AgentCanvas /> keep working;
   * remove it from your tree at your convenience.
   */
  const AgentCanvas: React.FC = () => null

  // ─── AgentPanel wrapper — injects provider config ───────────────────────

  const AgentPanelWrapped: React.FC<CadAgentPanelProps> = ({
    drawingId,
    open,
    onClose,
    position,
    className,
    theme,
    extraContext: panelExtraContext,
  }) => {
    return (
      <Panel
        drawingId={drawingId}
        provider={provider}
        maxIterations={maxIterations}
        maxTokens={maxTokens}
        systemPrompt={systemPrompt}
        extraContext={panelExtraContext ?? extraContext}
        open={open}
        onClose={onClose}
        position={position}
        className={className}
        theme={theme}
        modelName={modelName}
        contextLimit={contextLimit}
        reasoningEffort={reasoningEffort}
        sendSnapshotsToModel={sendSnapshotsToModel}
      />
    )
  }

  return { AgentPanel: AgentPanelWrapped, AgentCanvas }
}
