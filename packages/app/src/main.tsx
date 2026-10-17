import { init, WSClient } from '@buerli.io/classcad'
import { Buerligons } from '@buerli.io/buerligons'
import { createRoot } from 'react-dom/client'

// The page is opened with the invite of the session it shows (?invite=…), and joins it where the MCP serves it: at
// /session on the address the page came from. The MCP's own engine is the host; the page is a guest.
const invite = new URLSearchParams(location.search).get('invite') ?? undefined
init(id => new WSClient('/session', id, { invite, identity: { app: 'buerligons', kind: 'app' } }))

createRoot(document.getElementById('root')!).render(<Buerligons />)
