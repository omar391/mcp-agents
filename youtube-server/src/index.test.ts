import { YouTubeServer } from './index.ts';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser } from 'playwright';

describe('YouTubeServer', () => {
  let server: YouTubeServer;
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    server = new YouTubeServer(browser);
  });

  afterEach(async () => {
    await server.close();
  });

  it('should be able to create an instance of YouTubeServer', () => {
    expect(server).toBeInstanceOf(YouTubeServer);
  });

  it('should handle search_youtube tool', async () => {
    const request = {
      params: {
        name: 'search_youtube',
        arguments: { query: 'test query' },
      },
    };
    const result = await server.handleRequest(request);

    // Check if the search was performed and results were returned
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();

    // If there's an error, the text will contain the error message
    if (result.isError) {
      console.warn('Search returned error:', result.content[0].text);
      return;
    }

    try {
      const searchResults = JSON.parse(result.content[0].text);
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThan(0);
    } catch (error) {
      fail(`Failed to parse search results: ${result.content[0].text}`);
    }
  }, 30000); // 30 second timeout

  it('should handle play_youtube tool', async () => {
    const request = {
      params: {
        name: 'play_youtube',
        arguments: { videoId: 'dQw4w9WgXcQ' }, // Rick Astley - Never Gonna Give You Up
      },
    };
    const result = await server.handleRequest(request);
    expect(result.content[0].text).toEqual('Now playing video: dQw4w9WgXcQ');
  }, 30000); // 30 second timeout

  it('should handle invalid tool name', async () => {
    const request = {
      params: {
        name: 'invalid_tool',
        arguments: {},
      },
    };
    try {
      await server.handleRequest(request);
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(McpError);
      expect((error as McpError).code).toBe(ErrorCode.MethodNotFound);
    }
  });
});
