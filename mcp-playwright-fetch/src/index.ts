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
import { logger } from './utils/logger.js';

export class PlaywrightRendererServer {
  private server?: Server;

  constructor(initServer = true) {
    if (initServer) {
      this.server = new Server(
        {
          name: 'mcp-playwright-fetch',
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
              url: {
                type: 'string',
                description: 'The URL to fetch HTML from.',
              },
              html: {
                type: 'string',
                description: 'The HTML to render.',
              },
            },
            required: [],
          },
        },
        {
          name: 'render_json',
          description: 'Renders HTML to JSON.',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to fetch HTML from.',
              },
              html: {
                type: 'string',
                description: 'The HTML to render.',
              },
            },
            required: [],
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

    logger.debug('fetchPage starting for URL:', args.url);
    const browser = await chromium.launch();
    logger.debug('Browser launched');
    const context = await browser.newContext();
    const page = await context.newPage();

    // Add console logging from the browser
    page.on('console', msg => {
      logger.debug('Browser console:', msg.text());
    });

    // Add request/response logging
    page.on('request', request => {
      logger.debug('Browser request:', request.url());
    });
    page.on('response', response => {
      logger.debug('Browser response:', response.url(), response.status());
    });

    try {
      logger.debug('Navigating to URL');
      await page.goto(args.url, { timeout: 60000 });
      logger.debug('Waiting for network idle');
      await page.waitForLoadState('networkidle');
      logger.debug('Getting page content');
      const html = await page.content();
      logger.debug('Got HTML length:', html.length);
      return {
        content: [
          {
            type: 'text',
            text: html,
          },
        ],
      };
    } catch (error) {
      logger.error('Navigation error:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  public async renderMarkdown(args: any): Promise<any> {
    if (!args?.html && !args?.url) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments for render_markdown: either "html" or "url" must be provided');
    }

    logger.debug('renderMarkdown starting');
    let html: string | undefined = args?.html;

    if (args?.url) {
      try {
        logger.debug('Fetching URL for markdown:', args.url);
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(args.url, { timeout: 60000 });
        await page.waitForLoadState('networkidle');
        html = await page.content();
        await browser.close();
      } catch (error) {
        logger.error('Error fetching URL:', error);
        throw new McpError(ErrorCode.InternalError, `Failed to fetch URL: ${error}`);
      }
    }

    logger.debug('Converting HTML to Markdown, HTML length:', html?.length);
    const markdown = htmlToMd(html || "");
    logger.debug('Markdown result length:', markdown.length);
    return {
      content: [
        {
          type: 'text',
          text: markdown,
        },
      ],
    };
  }

  public async renderJson(args: any): Promise<any> {
    if (!args?.html && !args?.url) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments for render_json: either "html" or "url" must be provided');
    }

    logger.debug('renderJson starting');
    let html: string | undefined = args?.html;

    if (!html && args?.url) {
      try {
        logger.debug('Fetching URL for JSON:', args.url);
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(args.url, { timeout: 60000 });
        await page.waitForLoadState('networkidle');
        html = await page.content();
        await browser.close();
      } catch (error) {
        logger.error('Error fetching URL:', error);
        throw new McpError(ErrorCode.InternalError, `Failed to fetch URL: ${error}`);
      }
    }

    if (!html) {
      throw new McpError(ErrorCode.InvalidParams, "Invalid arguments for render_json");
    }

    logger.debug('Loading HTML into cheerio, HTML length:', html.length);
    const $ = cheerio.load(html, {
      xml: {
        xmlMode: false,
        decodeEntities: true
      }
    });

    function elementToJson(element: cheerio.Cheerio<any>): any {
      const node = element[0];
      if (!node) {
        logger.debug('No node found in elementToJson');
        return null;
      }

      logger.debug('Processing node:', node.name);
      const result: any = {
        tag: node.name.toLowerCase(),
      };

      // Add attributes if they exist
      const attrs = node.attribs;
      if (attrs && Object.keys(attrs).length > 0) {
        result.attributes = attrs;
        logger.debug('Node attributes:', attrs);
      }

      const children: any[] = [];

      // Process child nodes
      element.contents().each((_, content) => {
        if (content.type === 'text') {
          const text = $(content).text().trim();
          if (text) {
            children.push({
              type: 'text',
              value: text
            });
          }
        } else if (content.type === 'tag') {
          const childJson = elementToJson($(content));
          if (childJson) {
            children.push(childJson);
          }
        }
      });

      if (children.length > 0) {
        result.children = children;
        logger.debug('Node has children:', children.length);
      }

      return result;
    }

    // Special handling for HTML fragments
    if (!html.trim().toLowerCase().startsWith('<!doctype') && !html.trim().toLowerCase().startsWith('<html')) {
      logger.debug('Processing HTML fragment');
      const fragment = $.parseHTML(html);
      const elements = fragment.filter(el => el.type === 'tag').map(el => elementToJson($(el))).filter(Boolean);

      const result = {
        content: [{
          type: 'text',
          text: JSON.stringify({
            tag: 'root',
            children: elements
          }, null, 2)
        }]
      };
      logger.debug('Fragment JSON result:', result.content[0].text);
      return result;
    }

    // For full HTML documents
    logger.debug('Processing full HTML document');

    // Extract both HTML and BODY elements to create proper structure
    const html_element = $('html');
    const head = $('head');
    const body = $('body');

    logger.debug('Found html tag:', html_element.length > 0);
    logger.debug('Found head tag:', head.length > 0);
    logger.debug('Found body tag:', body.length > 0);

    // Create a proper DOM structure
    const htmlJson = elementToJson(html_element);

    // If we have a valid HTML structure, use it - otherwise fall back to body only
    if (htmlJson) {
      const result = {
        content: [{
          type: 'text',
          text: JSON.stringify({
            tag: 'root',
            children: [htmlJson]
          }, null, 2)
        }]
      };
      logger.debug('Full HTML document JSON result:', result.content[0].text);
      return result;
    } else {
      // Fallback to body-only if html element wasn't found or properly parsed
      const bodyJson = elementToJson(body);
      const result = {
        content: [{
          type: 'text',
          text: JSON.stringify({
            tag: 'root',
            children: [bodyJson]
          }, null, 2)
        }]
      };
      logger.debug('Body-only JSON result:', result.content[0].text);
      return result;
    }
  }

  async run() {
    if (!this.server) {
      throw new Error('Server not initialized');
    }
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Playwright Renderer MCP server running on stdio');
  }
}

const server = new PlaywrightRendererServer();
server.run().catch(console.error);