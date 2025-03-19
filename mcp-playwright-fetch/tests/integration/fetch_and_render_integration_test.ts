import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PlaywrightRendererServer } from '../../src/index.js';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { logger } from '../../src/utils/logger.js';

describe('Integration Test: Fetch and Render', () => {
    let server: PlaywrightRendererServer;
    let browser: Browser | null = null;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        if (browser) {
            try {
                await browser.close();
            } catch (err) {
                logger.error('Error closing browser:', err);
            }
        }
    });

    beforeEach(async () => {
        server = new PlaywrightRendererServer(false);
    });

    async function withBrowserTest<T>(operation: (page: Page) => Promise<T>): Promise<T> {
        if (!browser) throw new Error('Browser not initialized');
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
            return await operation(page);
        } finally {
            try {
                await page.close();
                await context.close();
            } catch (err) {
                logger.error('Error cleaning up browser resources:', err);
            }
        }
    }

    it('should fetch and render a webpage to Markdown', async () => {
        await withBrowserTest(async (page) => {
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

        expect(parsedJson.tag).toBe('root');
        expect(parsedJson.children[0].tag).toBe('div');
        expect(parsedJson.children[0].children).toHaveLength(2);
        expect(parsedJson.children[0].children[0].tag).toBe('h1');
        expect(parsedJson.children[0].children[1].tag).toBe('p');
    });

    it('should fetch and convert a live webpage to JSON', async () => {
        await withBrowserTest(async (page) => {
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

            // Required elements must exist
            expect(parsedJson.tag).toBe('root');
            expect(Array.isArray(parsedJson.children)).toBe(true);
            expect(findElement(parsedJson, 'title', 'Example Domain')).toBe(true);
            expect(findElement(parsedJson, 'body')).toBe(true);
            expect(findElement(parsedJson, 'h1', 'Example Domain')).toBe(true);
        });
    }, 45000);

    it('should fetch and render a different webpage to Markdown', async () => {
        await withBrowserTest(async (page) => {
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
        
        await withBrowserTest(async (page) => {
            await page.goto(url, {
                waitUntil: 'load',
                timeout: 30000
            });
            
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