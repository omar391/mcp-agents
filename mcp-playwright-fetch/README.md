# mcp-playwright-fetch

A Model Context Protocol (MCP) server that uses Playwright to fetch and render web pages to Markdown or JSON.

## Installation

```bash
bun install
```

## Usage

```typescript
import { PlaywrightRendererServer } from 'mcp-playwright-fetch';

const server = new PlaywrightRendererServer();
const result = await server.fetchPage({ url: 'https://example.com' });
console.log(result.content[0].text);
```

## MCP Server Settings

To use this package as an MCP server, add the following configuration to your MCP settings:

```json
{
  "mcp-playwright-fetch@1.0.0": {
    "command": "bunx",
    "args": [
      "-y",
      "mcp-playwright-fetch"
    ],
    "disabled": false,
    "alwaysAllow": []
  }
}
```

## License

MIT