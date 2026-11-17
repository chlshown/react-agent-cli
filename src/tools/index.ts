import type { ToolSet } from 'ai';
import { webSearch } from './search.js';
import { fetchPage } from './fetch.js';
import { calculator } from './calculator.js';
import { readFileTool, writeFileTool, listFilesTool } from './files.js';
import { initTavilyMcpTools } from '../mcp.js';

/**
 * 工具注册表：Agent 能做什么，全在这里定义。
 * 搜索能力优先走 Tavily 官方 MCP 工具集（含 search/extract/research/map/crawl），
 * MCP 不可用时回退到自研 REST 版 webSearch —— 工具层可插拔。
 * 注意：MCP 客户端初始化是异步的，所以这里返回 Promise，需在启动时 await 一次。
 */
export async function buildTools(): Promise<ToolSet> {
  const mcpTools = await initTavilyMcpTools();

  return {
    ...(mcpTools ?? { webSearch }), // MCP 优先，无则 REST fallback
    fetchPage,
    calculator,
    readFile: readFileTool,
    writeFile: writeFileTool,
    listFiles: listFilesTool,
  };
}
