import { describe, it, expect } from 'vitest';
import { PlaywrightRendererServer } from '../../src/src/index'; // Adjust the import path as needed

describe('Integration Test: Fetch and Render', () => {
  it('should fetch and render a webpage to Markdown', async () => {
    const server = new PlaywrightRendererServer(false);

    // Fetch the page
    const fetchResult = await server.fetchPage({ url: 'https://example.com' });
    expect(fetchResult.content[0].text).toContain('Example Domain');

    // Render to Markdown
    const renderResult = await server.renderMarkdown({ html: fetchResult.content[0].text });
    expect(renderResult.content[0].text).toContain('Example Domain');
  });

  it('should fetch and render a webpage to JSON', async () => {
    const server = new PlaywrightRendererServer(false);

    // Fetch the page
    const fetchResult = await server.fetchPage({ url: 'https://example.com' });
    expect(fetchResult.content[0].text).toContain('Example Domain');

    // Render to JSON
    const renderResult = await server.renderJson({ html: fetchResult.content[0].text });
    const parsedJson = JSON.parse(renderResult.content[0].text);
    expect(parsedJson.tag).toBeDefined();
    if (parsedJson.children && parsedJson.children.length > 1) {
      expect(parsedJson.children[1].tag).toBe('body');
    }
  });

  it('should fetch and render a different webpage to Markdown', async () => {
    const server = new PlaywrightRendererServer(false);

    // Fetch the page
    const fetchResult = await server.fetchPage({ url: 'https://www.wikipedia.org' });
    expect(fetchResult.content[0].text).toContain('Wikipedia');

    // Render to Markdown
    const renderResult = await server.renderMarkdown({ html: fetchResult.content[0].text });
    expect(renderResult.content[0].text).toContain('Wikipedia');
  });

  it('should fetch and render Ashby job description to Markdown', async () => {
    const server = new PlaywrightRendererServer(false);
    const url = 'https://jobs.ashbyhq.com/magic.dev/4c254ab3-7af8-4592-9599-68db5a6520bf';

    // Fetch the page
    const fetchResult = await server.fetchPage({ url });
    expect(fetchResult.content[0].text).toContain('magic.dev');

    // Render to Markdown
    const renderResult = await server.renderMarkdown({ html: fetchResult.content[0].text });

    expect(renderResult.content[0].text).toContain('Apply for this Job');
  });
});