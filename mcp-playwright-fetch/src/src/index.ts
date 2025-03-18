import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium } from 'playwright';
import htmlToMd from 'html-to-md';
import * as cheerio from 'cheerio';

export class PlaywrightRendererServer {
  private server?: Server;

  constructor(initServer = true) {
    if (initServer) {
      this.server = new Server(
        {
          name: 'playwright-renderer',
          version: '0.1.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      this.setupToolHandlers();

      this.server.onerror = (error) => console.error('[MCP Error]', error);
      process.on('SIGINT', async () => {
        if (this.server) {
          await this.server.close();
        }
        process.exit(0);
      });
    }
  }

  private setupToolHandlers() {
    if (!this.server) {
      throw new Error('Server not initialized');
    }

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'fetch_page',
          description: 'Fetches a webpage and returns the rendered HTML.',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to fetch.',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'render_markdown',
          description: 'Renders HTML to Markdown.',
          inputSchema: {
            type: 'object',
            properties: {
              html: {
                type: 'string',
                description: 'The HTML to render.',
              },
            },
            required: ['html'],
          },
        },
        {
          name: 'render_json',
          description: 'Renders HTML to JSON.',
          inputSchema: {
            type: 'object',
            properties: {
              html: {
                type: 'string',
                description: 'The HTML to render.',
              },
            },
            required: ['html'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'fetch_page':
          return this.fetchPage(request.params.arguments);
        case 'render_markdown':
          return this.renderMarkdown(request.params.arguments);
        case 'render_json':
          return this.renderJson(request.params.arguments);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  public async fetchPage(args: any) {
    if (!args || typeof args.url !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments for fetch_page');
    }

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(args.url, { timeout: 60000 }); // Increased timeout to 60 seconds
      await page.waitForLoadState('networkidle');
      const html = await page.content();
      return {
        content: [
          {
            type: 'text',
            text: html,
          },
        ],
      };
    } catch (error) {
      console.error('Navigation error:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  public async renderMarkdown(args: any) {
    if (!args || typeof args.html !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments for render_markdown');
    }
    const markdown = htmlToMd(args.html);
    return {
      content: [
        {
          type: 'text',
          text: markdown,
        },
      ],
    };
  }

  public async renderJson(args: any) {
    if (!args || typeof args.html !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, "Invalid arguments for render_json");
    }
    const $ = cheerio.load(args.html);
    
    function elementToJson(element: cheerio.Cheerio<any>): any {
      const node = element[0];
      if (!node) return null;
      
      const result: any = {
        tag: node.name.toLowerCase(),
      };

      if (node.attribs && Object.keys(node.attribs).length > 0) {
        result.attributes = node.attribs;
      }

      const contents = element.contents();
      const children = contents && typeof contents.get === 'function' ? contents.get() : [];

      if (children && children.length > 0) {
        result.children = [];
        for (const child of children) {
          const childNode = $(child);
          if (child.type === "text") {
            const text = child.data?.trim() || childNode.text().trim();
            if (text) {
              result.children.push({
                type: "text",
                value: text,
              });
            }
          } else if (child.type === "tag") {
            result.children.push(elementToJson(childNode));
          }
        }
      }
      return result;
    }

    const json = elementToJson($(":root"));
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(json, null, 2)
      }]
    }
  }

  async run() {
    if (!this.server) {
      throw new Error('Server not initialized');
    }
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playwright Renderer MCP server running on stdio');
  }
}

if (process.argv[1] === import.meta.url) {
  const server = new PlaywrightRendererServer();
  server.run().catch(console.error);
}