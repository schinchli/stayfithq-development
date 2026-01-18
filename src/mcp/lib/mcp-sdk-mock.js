/**
 * Mock MCP SDK for demonstration purposes
 * In production, this would be replaced with the actual @modelcontextprotocol/sdk
 */

class Server {
  constructor(info, capabilities) {
    this.info = info;
    this.capabilities = capabilities;
    this.handlers = new Map();
  }

  setRequestHandler(schema, handler) {
    this.handlers.set(schema.name || 'handler', handler);
  }

  async connect(transport) {
    console.log(`MCP Server "${this.info.name}" v${this.info.version} connected`);
  }
}

class StdioServerTransport {
  constructor() {
    this.connected = false;
  }
}

const ListToolsRequestSchema = { name: 'list_tools' };
const CallToolRequestSchema = { name: 'call_tool' };

module.exports = {
  Server,
  StdioServerTransport,
  ListToolsRequestSchema,
  CallToolRequestSchema
};
