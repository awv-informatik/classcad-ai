// Default ports, in a leaf module so tool docs can name them without importing
// the daemon (which imports the MCP server, which imports the tool docs).

/** Daemon HTTP port. Not 9095: a ClassCAD worker listens on 9094 (ws) AND 9095 (wss). */
export const DEFAULT_DAEMON_PORT = 9097
