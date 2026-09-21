// Task-aware context compaction. See each module's header for the reasoning:
//   annotate  what a tool result is worth to the CAD task (kind, drawing revision, digest)
//   policy    what to condense, in which order
//   ledger    what stands in for condensed work — generated from the live drawing, not by a model
//   render    the context the model actually receives (the stored history is never rewritten)
//   estimate  prompt size, calibrated against the provider's real usage numbers
//   overflow  recognising "the prompt did not fit"

export { annotate, advance, callMutates, createTracker, isReadOnlyScript, markDeadTimeline, servedDocKeys, summarizeOps } from './annotate'
export type { ToolCall, Tracker } from './annotate'
export { compact, groupsOf, thresholds } from './policy'
export type { CompactionCounts, CompactionReport, CompactOptions } from './policy'
export { buildJournal, buildStateBlock } from './ledger'
export { digestTree } from './digestTree'
export { checkWireInvariants, renderContext, ELIDED_SCRIPT_MARKER } from './render'
export { calibrate, estimateTokens, measure, messageUnits, DEFAULT_TOKENS_PER_CHAR, IMAGE_TOKENS } from './estimate'
export type { Calibration } from './estimate'
export { isContextOverflow, parseLimitFromError } from './overflow'
