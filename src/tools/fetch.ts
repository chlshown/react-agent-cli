import { tool } from 'ai';
import { z } from 'zod';
import TurndownService from 'turndown';
import { withRetry } from '../retry.js';

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
// 去掉导航/脚本等噪音节点
turndown.remove(['script', 'style', 'nav', 'header', 'footer', 'iframe', 'noscript']);

const MAX_CHARS = 8000; // 截断，防止撑爆上下文（上下文工程的基本功）

// 网页抓取转 Markdown
export const fetchPage = tool({
  description: '抓取指定 URL 的网页正文并转为 Markdown。搜索到候选链接后用它读全文。',
  inputSchema: z.object({
    url: z.string().url().describe('完整 URL，含 https://'),
  }),
  execute: async ({ url }) =>
    withRetry(
      async () => {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        const md = turndown.turndown(html);
        return md.length > MAX_CHARS
          ? `${md.slice(0, MAX_CHARS)}\n\n[...内容过长已截断，共 ${md.length} 字符]`
          : md;
      },
      { label: 'fetchPage' },
    ),
});
