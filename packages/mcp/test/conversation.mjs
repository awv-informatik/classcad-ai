// The tests talk to the MCP as one conversation would (src/drawings.ts): the
// first call that works on a model opens a drawing ("new"), every later call
// names the id that answer gave.
import { MACHINE_TOOLS } from '../dist/drawings.js'

export const OPENED = /Drawing "(d-[a-z0-9]+)" is new/

export function conversation() {
  let drawing = 'new'
  return {
    /** The call's arguments with this conversation's drawing (none for machine tools, or for session_info before there is one). */
    args(name, args = {}) {
      if (MACHINE_TOOLS.has(name) || 'drawing' in args || (name === 'session_info' && drawing === 'new')) return args
      return { drawing, ...args }
    },
    /** Reads the id from the answer that opened the drawing. */
    saw(message) {
      const texts = (message?.result?.content ?? []).filter(b => b.type === 'text').map(b => b.text)
      const id = texts.map(t => OPENED.exec(t)?.[1]).find(Boolean)
      if (id && drawing === 'new') drawing = id
    },
    get drawing() {
      return drawing
    },
    /** Starts over: the next call opens a new drawing. */
    reset() {
      drawing = 'new'
    },
  }
}
