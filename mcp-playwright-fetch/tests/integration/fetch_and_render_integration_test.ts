import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PlaywrightRendererServer } from '../../src/index.js';
import { chromium, Browser, BrowserContext } from 'playwright';
import { logger } from '../../src/utils/logger.js';

type Validation = {
  name: string;
  validate: () => boolean;
};

describe('Integration Test: Fetch and Render', () => {
  let server: PlaywrightRendererServer;
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  beforeAll(async () => {
    // Create a single browser instance for all tests
    browser = await chromium.launch();
  });

  afterAll(async () => {
    // Clean up the shared browser instance
    if (browser) {
      await browser.close();
      browser = null;
    }
  });

  beforeEach(async () => {
    server = new PlaywrightRendererServer(false);
    if (browser) {
      context = await browser.newContext();
    }
  });

  afterEach(async () => {
    if (context) {
      await context.close();
      context = null;
    }
  });

  async function withPage<T>(operation: (page: any) => Promise<T>): Promise<T> {
    if (!context) throw new Error('Browser context not initialized');
    const page = await context.newPage();
    try {
      return await operation(page);
    } finally {
      await page.close();
    }
  }

  it('should fetch and render a webpage to Markdown', async () => {
    await withPage(async (page) => {
      await page.goto('https://example.com', { waitUntil: 'load' });
      await page.waitForSelector('h1', { timeout: 10000 });

      const html = await page.content();
      const fetchResult = { content: [{ type: 'text', text: html }] };

      expect(fetchResult.content[0].text).toContain('Example Domain');

      const renderResult = await server.renderMarkdown({ html: fetchResult.content[0].text });
      expect(renderResult.content[0].text).toContain('Example Domain');
    });
  }, 45000);

  it('should convert simple HTML to JSON', async () => {
    const simpleHtml = '<div><h1>Test Content</h1><p>Hello World</p></div>';
    const jsonResult = await server.renderJson({ html: simpleHtml });
    const parsedJson = JSON.parse(jsonResult.content[0].text);

    const validations: Validation[] = [
      {
        name: 'root tag',
        validate: () => parsedJson.tag === 'root'
      },
      {
        name: 'div tag',
        validate: () => parsedJson.children[0].tag === 'div'
      },
      {
        name: 'children length',
        validate: () => parsedJson.children[0].children.length === 2
      },
      {
        name: 'h1 tag',
        validate: () => parsedJson.children[0].children[0].tag === 'h1'
      },
      {
        name: 'p tag',
        validate: () => parsedJson.children[0].children[1].tag === 'p'
      }
    ];

    for (const validation of validations) {
      expect(validation.validate(), `Failed at: ${validation.name}`).toBe(true);
    }
  });

  it('should fetch and convert a live webpage to JSON', async () => {
    await withPage(async (page) => {
      logger.info('Fetching example.com...');
      await page.goto('https://example.com', { waitUntil: 'load' });
      await page.waitForSelector('h1', { timeout: 10000 });

      const html = await page.content();
      const fetchResult = { content: [{ type: 'text', text: html }] };

      logger.info('Converting HTML to JSON...');
      const jsonResult = await server.renderJson({ html: fetchResult.content[0].text });
      const parsedJson = JSON.parse(jsonResult.content[0].text);

      function findElement(node: any, tag: string, text?: string): boolean {
        if (node.tag === tag) {
          if (!text) return true;
          return node.children?.some((child: any) =>
            child.type === 'text' && child.value.includes(text)
          );
        }
        if (node.children) {
          return node.children.some((child: any) => findElement(child, tag, text));
        }
        return false;
      }

      const validations: Validation[] = [
        {
          name: 'root tag',
          validate: () => parsedJson.tag === 'root'
        },
        {
          name: 'children array',
          validate: () => Array.isArray(parsedJson.children)
        },
        {
          name: 'title with text',
          validate: () => findElement(parsedJson, 'title', 'Example Domain')
        },
        {
          name: 'body element',
          validate: () => findElement(parsedJson, 'body')
        },
        {
          name: 'h1 with text',
          validate: () => findElement(parsedJson, 'h1', 'Example Domain')
        }
      ];

      for (const validation of validations) {
        expect(validation.validate(), `Failed at: ${validation.name}`).toBe(true);
      }
    });
  }, 45000);

  it('should fetch and render a different webpage to Markdown', async () => {
    await withPage(async (page) => {
      await page.goto('https://www.wikipedia.org', { waitUntil: 'load' });
      await page.waitForSelector('#www-wikipedia-org', { timeout: 10000 });

      const html = await page.content();
      const fetchResult = { content: [{ type: 'text', text: html }] };

      expect(fetchResult.content[0].text.toLowerCase()).toMatch(/(wikimedia|wikipedia|wiki)/);

      const renderResult = await server.renderMarkdown({ html: fetchResult.content[0].text });
      expect(renderResult.content[0].text.toLowerCase()).toMatch(/(wikimedia|wikipedia|wiki)/);
    });
  }, 45000);

  it('should fetch and render Ashby job listing to Markdown', async () => {
    const url = 'https://jobs.ashbyhq.com/magic.dev/4c254ab3-7af8-4592-9599-68db5a6520bf';

    await withPage(async (page) => {
      // Set a longer timeout for this specific navigation
      await page.goto(url, {
        waitUntil: 'load',
        timeout: 30000
      });

      // Wait for job content with increased timeout
      await page.waitForSelector('h1,h2,h3,p', {
        timeout: 20000,
        state: 'attached'
      });

      const html = await page.content();
      const fetchResult = { content: [{ type: 'text', text: html }] };

      const htmlRegex = /(software|engineer|job|position)/i;
      expect(fetchResult.content[0].text).toMatch(htmlRegex);

      const renderResult = await server.renderMarkdown({ html: fetchResult.content[0].text });
      const markdown = renderResult.content[0].text;
      const markdownRegex = /(software|engineer|job|position)/i;

      if (!markdownRegex.test(markdown)) {
        logger.testFailure('Markdown content validation failed:', {
          contentLength: markdown.length,
          firstChars: markdown.substring(0, 200),
          lastChars: markdown.substring(markdown.length - 200),
          searchPattern: markdownRegex.toString()
        });
      }

      expect(markdown).toMatch(markdownRegex);
    });
  }, 60000);
});