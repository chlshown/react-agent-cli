import { tool } from 'ai';
import { z } from 'zod';
import { withRetry } from '../retry.js';
import { log } from '../logger.js';

// 网页搜索：Tavily API（https://tavily.com，免费 1000 次/月）
export const webSearch = tool({
  description: '搜索网页，返回标题、摘要与链接。适合查最新资讯、技术文档入口。',
  inputSchema: z.object({
    query: z.string().describe('搜索关键词，中英文均可'),
    maxResults: z.number().int().min(1).max(10).default(5).describe('返回条数'),
  }),
  execute: async ({ query, maxResults }) =>
    withRetry(
      async () => {
        const key = process.env.TAVILY_API_KEY;
        if (!key) throw new Error('未配置 TAVILY_API_KEY');
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: key, query, max_results: maxResults }),
        });
        if (!res.ok) throw new Error(`Tavily HTTP ${res.status}: ${await res.text()}`);
        const data = (await res.json()) as {
          results: Array<{ title: string; url: string; content: string }>;
        };
        return data.results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.content.slice(0, 300)}`);
      },
      { label: 'webSearch' },
    ),
});
