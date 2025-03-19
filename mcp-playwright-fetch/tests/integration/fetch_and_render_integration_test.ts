import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlaywrightRendererServer } from '../../src/index';
import * as cheerio from 'cheerio';

describe('Integration Test: Fetch and Render', () => {
  let server: PlaywrightRendererServer;

  beforeEach(async () => {
    server = new PlaywrightRendererServer(false);
  });

  it('should fetch and render a webpage to Markdown', async () => {
    console.log('Debug - Starting example.com fetch test');
    const fetchResult = await server.fetchPage({ url: 'https://example.com' });
    console.log('Debug - Fetch Result HTML:', fetchResult.content[0].text);

    // Debug HTML structure
    const $ = cheerio.load(fetchResult.content[0].text);
    console.log('Debug - Page title:', $('title').text());
    console.log('Debug - H1 content:', $('h1').text());
    console.log('Debug - Body text:', $('body').text());

    expect(fetchResult.content[0].text).toContain('Example Domain');

    const renderResult = await server.renderMarkdown({ html: fetchResult.content[0].text });
    console.log('Debug - Markdown Result:', renderResult.content[0].text);
    expect(renderResult.content[0].text).toContain('Example Domain');
  }, 30000);

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
    const fetchResult = await server.fetchPage({ url: 'https://example.com' });
    const jsonResult = await server.renderJson({ html: fetchResult.content[0].text });
    const parsedJson = JSON.parse(jsonResult.content[0].text);

    expect(parsedJson.tag).toBe('root');
    expect(Array.isArray(parsedJson.children)).toBe(true);

    // Look for key elements in the page structure
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

    // Verify we have both the structure and content we expect
    expect(findElement(parsedJson, 'title', 'Example Domain')).toBe(true);
    expect(findElement(parsedJson, 'body')).toBe(true);
    expect(findElement(parsedJson, 'h1', 'Example Domain')).toBe(true);
  }, 30000);

  it('should fetch and render a different webpage to Markdown', async () => {
    const fetchResult = await server.fetchPage({ url: 'https://www.wikipedia.org' });
    console.log('Debug - Wikipedia Fetch Result:', fetchResult.content[0].text);
    // Look for Wikipedia reference in various languages/formats
    expect(fetchResult.content[0].text.toLowerCase()).toMatch(/(wikimedia|wikipedia|wiki)/);

    const renderResult = await server.renderMarkdown({ html: fetchResult.content[0].text });
    console.log('Debug - Wikipedia Markdown Result:', renderResult.content[0].text);
    expect(renderResult.content[0].text.toLowerCase()).toMatch(/(wikimedia|wikipedia|wiki)/);
  }, 30000);

  it('should fetch and render Ashby job listing to Markdown', async () => {
    const url = 'https://jobs.ashbyhq.com/magic.dev/4c254ab3-7af8-4592-9599-68db5a6520bf';

    const fetchResult = await server.fetchPage({ url });
    console.log('Debug - Ashby Fetch Result:', fetchResult.content[0].text);
    const html = fetchResult.content[0].text;
    console.log('Debug - Ashby HTML:', html);
    // Look for any job-related terms that are likely to appear
    const htmlRegex = /(software|engineer|job|position)/i;
    console.log('Debug - HTML Regex:', htmlRegex);
    console.log('Debug - HTML Test Result:', htmlRegex.test(html));
    expect(html).toMatch(htmlRegex);

    const renderResult = await server.renderMarkdown({ html: fetchResult.content[0].text });
    console.log('Debug - Ashby Markdown Result:', renderResult.content[0].text);
    const markdown = renderResult.content[0].text;
    console.log('Debug - Ashby Markdown:', markdown);
    const markdownRegex = /(software|engineer|job|position)/i;
    console.log('Debug - Markdown Regex:', markdownRegex);
    console.log('Debug - Markdown Test Result:', markdownRegex.test(markdown));
    expect(markdown).toMatch(markdownRegex);
  }, 30000);
});