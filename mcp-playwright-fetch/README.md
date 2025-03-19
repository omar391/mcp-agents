# mcp-playwright-fetch

[![npm version](https://badge.fury.io/js/mcp-playwright-fetch.svg)](https://www.npmjs.com/package/mcp-playwright-fetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that uses Playwright to fetch and render web pages to Markdown or JSON. This package provides a reliable way to:

- Fetch web pages with JavaScript rendering support
- Convert HTML content to clean Markdown
- Transform HTML into structured JSON
- Handle dynamic web applications
- Support authentication and cookies

## Features

- 🎭 **Playwright-powered**: Full browser automation capabilities
- 📝 **Markdown Conversion**: Clean, readable Markdown output
- 🔄 **JSON Transformation**: Structured HTML-to-JSON conversion
- 🔒 **Secure**: Configurable request handling
- 🚀 **Fast**: Optimized for performance
- 📦 **MCP Compatible**: Works with Model Context Protocol

## Installation

Using bun:
```bash
bun add mcp-playwright-fetch
```

Using npm:
```bash
npm install mcp-playwright-fetch
```

Using yarn:
```bash
yarn add mcp-playwright-fetch
```

## Usage

### Basic Page Fetching

```typescript
import { PlaywrightRendererServer } from 'mcp-playwright-fetch';

const server = new PlaywrightRendererServer();

// Fetch a webpage
const result = await server.fetchPage({ 
    url: 'https://example.com' 
});
console.log(result.content[0].text);
```

### Converting to Markdown

```typescript
// Convert HTML to Markdown
const markdownResult = await server.renderMarkdown({
    html: '<h1>Hello World</h1><p>This is <strong>bold</strong> text.</p>'
});
console.log(markdownResult.content[0].text);

// Fetch and convert to Markdown
const markdownFromUrl = await server.renderMarkdown({
    url: 'https://example.com'
});
console.log(markdownFromUrl.content[0].text);
```

### Converting to JSON

```typescript
// Convert HTML to JSON
const jsonResult = await server.renderJson({
    html: '<div><h1>Title</h1><p>Content</p></div>'
});
console.log(JSON.parse(jsonResult.content[0].text));

// Fetch and convert to JSON
const jsonFromUrl = await server.renderJson({
    url: 'https://example.com'
});
console.log(JSON.parse(jsonFromUrl.content[0].text));
```

## MCP Server Configuration

To use this package as an MCP server, add the following configuration to your MCP settings:

```json
{
  "mcp-playwright-fetch": {
    "command": "bunx",  // Or npx, pnpx etc
    "args": [
      "-y",
      "mcp-playwright-fetch"
    ]
  }
}
```

The server provides three main operations:
- `fetch_page`: Fetch a webpage with full JavaScript rendering support
- `render_markdown`: Convert HTML to clean Markdown (from URL or HTML string)
- `render_json`: Transform HTML into structured JSON (from URL or HTML string)

## Development

### Setup

1. Clone the repository:
```bash
git clone https://github.com/roo/mcp-playwright-fetch.git
cd mcp-playwright-fetch
```

2. Install dependencies:
```bash
bun install
```

3. Build the project:
```bash
bun run build
```

### Testing

Run all tests:
```bash
bun test
```

Run specific test suites:
```bash
bun test tests/unit          # Unit tests only
bun test tests/integration   # Integration tests only
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Roo