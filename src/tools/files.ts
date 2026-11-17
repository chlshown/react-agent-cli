import { tool } from 'ai';
import { z } from 'zod';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

// 文件读写沙箱：所有路径强制解析到 ./workspace 下，防目录穿越（工具安全，面试考点）
const ROOT = path.resolve(process.cwd(), 'workspace');

function safePath(p: string): string {
  const abs = path.resolve(ROOT, p);
  if (!abs.startsWith(ROOT + path.sep) && abs !== ROOT) {
    throw new Error(`路径越界：只允许访问 workspace/ 目录（收到 "${p}"）`);
  }
  return abs;
}

export const readFileTool = tool({
  description: '读取 workspace/ 目录下的文本文件内容。',
  inputSchema: z.object({ path: z.string().describe('相对 workspace/ 的路径，如 notes.md') }),
  execute: async ({ path: p }) => readFile(safePath(p), 'utf-8'),
});

export const writeFileTool = tool({
  description: '把内容写入 workspace/ 目录下的文件（覆盖写）。用于保存研究笔记、最终报告。',
  inputSchema: z.object({
    path: z.string().describe('相对 workspace/ 的路径，如 report.md'),
    content: z.string().describe('文件完整内容'),
  }),
  execute: async ({ path: p, content }) => {
    const abs = safePath(p);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, content, 'utf-8');
    return `已写入 ${p}（${content.length} 字符）`;
  },
});

export const listFilesTool = tool({
  description: '列出 workspace/ 目录下的文件。',
  inputSchema: z.object({}),
  execute: async () => {
    const entries = await readdir(ROOT, { recursive: true, withFileTypes: true });
    const files = entries.filter((e) => e.isFile()).map((e) => path.relative(ROOT, e.parentPath ? path.join(e.parentPath, e.name) : e.name));
    return files.length ? files.join('\n') : '（workspace 为空）';
  },
});
