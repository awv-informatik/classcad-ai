// Tools of the machine, not of a model (docs, sign-in, account): they take no
// drawing (drawings.ts). In a leaf module, so the tests can name them without
// loading the MCP, whose sign-in reads its settings when it is loaded.
export const MACHINE_TOOLS = new Set(['docs', 'list_methods', 'describe_method', 'login', 'account'])
