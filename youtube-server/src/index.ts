#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, Page, Browser } from 'playwright';

export class YouTubeServer {
  private readonly server: Server;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private readonly isTestMode: boolean;

  constructor(testBrowser?: Browser) {
    this.isTestMode = !!testBrowser;
    if (testBrowser) {
      this.browser = testBrowser;
    }

    this.server = new Server(
      {
        name: 'youtube-server',
        version: '0.1.0',
        description: 'An MCP youtube player using Playwright',
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
      await this.close();
      process.exit(0);
    });
  }

  private async initBrowser() {
    if (!this.browser && !this.isTestMode) {
      this.browser = await chromium.launch({
        headless: false,
      });
    }
    if (!this.page && this.browser) {
      this.page = await this.browser.newPage();
      await this.page.goto('https://www.youtube.com');
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_youtube',
          description: 'Search for videos on YouTube using Playwright',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'play_youtube',
          description: 'Play a YouTube video using Playwright',
          inputSchema: {
            type: 'object',
            properties: {
              videoId: {
                type: 'string',
                description: 'Video ID',
              },
            },
            required: ['videoId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return this.handleRequest(request);
    });
  }

  private async handleConsentDialog(page: Page) {
    try {
      // Try to find and click the "Accept all" button in the consent dialog
      const acceptButton = await page.$('button[aria-label="Accept all"]');
      if (acceptButton) {
        await acceptButton.click();
        await page.waitForTimeout(1000); // Wait for dialog to disappear
      }
    } catch (error) {
      console.log('No consent dialog found or already accepted');
    }
  }

  // Public method to handle requests for both MCP server and testing
  async handleRequest(request: any) {
    console.log('Handling request:', request);
    await this.initBrowser();
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    switch (request.params.name) {
      case 'search_youtube':
        try {
          console.log(
            'Searching YouTube with arguments:',
            request.params.arguments
          );
          if (
            !request.params.arguments ||
            typeof request.params.arguments !== 'object' ||
            !('query' in request.params.arguments) ||
            typeof request.params.arguments.query !== 'string'
          ) {
            throw new Error('Invalid arguments: query must be a string');
          }
          const { query } = request.params.arguments;

          await this.handleConsentDialog(this.page);

          // Clear the search input and type the new query
          await this.page.click('input[name="search_query"]');
          await this.page.fill('input[name="search_query"]', '');
          await this.page.fill('input[name="search_query"]', query);
          await this.page.press('input[name="search_query"]', 'Enter');

          // Wait for search results to appear
          await this.page.waitForSelector('ytd-video-renderer', {
            timeout: 10000,
          });

          // Give a short delay for all results to load
          await this.page.waitForTimeout(2000);

          const searchResults = await this.page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('ytd-video-renderer');
            for (const item of items) {
              const titleElement = item.querySelector('#video-title');
              const videoUrl = titleElement?.getAttribute('href');
              const videoId = videoUrl ? videoUrl.split('v=')[1] : null;

              if (titleElement && videoId) {
                results.push({
                  videoId: videoId,
                  title: titleElement.textContent?.trim(),
                  channel: item
                    .querySelector('#channel-name #text')
                    ?.textContent?.trim(),
                  thumbnail: item
                    .querySelector('img')
                    ?.getAttribute('src')
                    ?.split('?')[0],
                });
              }
            }
            return results;
          });

          console.log('Search results:', searchResults);
          if (searchResults.length === 0) {
            throw new Error('No search results found');
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(searchResults, null, 2),
              },
            ],
          };
        } catch (error) {
          console.error('Error searching YouTube:', error);
          return {
            content: [
              {
                type: 'text',
                text: `Error searching YouTube: ${error}`,
              },
            ],
            isError: true,
          };
        }
      case 'play_youtube':
        try {
          console.log(
            'Playing YouTube video with arguments:',
            request.params.arguments
          );
          if (
            !request.params.arguments ||
            typeof request.params.arguments !== 'object' ||
            !('videoId' in request.params.arguments) ||
            typeof request.params.arguments.videoId !== 'string'
          ) {
            throw new Error('Invalid arguments: videoId must be a string');
          }
          const { videoId } = request.params.arguments;
          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          await this.page.goto(videoUrl);

          await this.handleConsentDialog(this.page);

          // Wait for video player to be present
          await this.page.waitForSelector('#movie_player', {
            timeout: 10000,
            state: 'visible'
          });

          // Try to start playback by clicking the video player
          try {
            await this.page.click('#movie_player');
          } catch (error) {
            console.log('Could not click player, video may already be playing');
          }

          // Get the video title if available, but don't fail if we can't
          let title = '';
          try {
            const titleElement = await this.page.$('h1.ytd-video-primary-info-renderer');
            if (titleElement) {
              title = (await titleElement.textContent())?.trim() ?? '';
            }
          } catch (error) {
            console.log('Could not get video title, but video is playing');
          }

          console.log('Video playback started');
          return {
            content: [
              {
                type: 'text',
                text: title 
                  ? `Now playing video: ${title} (${videoUrl})`
                  : `Now playing video: ${videoUrl}`,
              },
            ],
          };
        } catch (error) {
          console.error('Error playing YouTube video:', error);
          return {
            content: [
              {
                type: 'text',
                text: `Error playing YouTube video: ${error}`,
              },
            ],
            isError: true,
          };
        }
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('YouTube MCP server running on stdio');
  }

  async close() {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser && !this.isTestMode) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new YouTubeServer();
  server.run().catch(console.error);
}
