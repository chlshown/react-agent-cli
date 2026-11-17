import { experimental_createMCPClient as createMCPClient, type experimental_MCPClient as MCPClient } from '@ai-sdk/mcp';
import type { ToolSet } from 'ai';
import { log } from './logger.js';

/**
 * Tavily 官方远程 MCP 服务器接入（Streamable HTTP transport）。
 * URL 形如 https://mcp.tavily.com/mcp/?tavilyApiKey=tvly-xxx（key 在查询参数里）。
 * 拿到的是官方维护的工具集：tavily-search / tavily-extract / tavily-research / tavily-map / tavily-crawl
 */
let tavilyClient: MCPClient | null = null;

export async function initTavilyMcpTools(): Promise<ToolSet | null> {
  const url = process.env.TAVILY_MCP_URL;
  if (!url) {
    log.info('未配置 TAVILY_MCP_URL，跳过 MCP，搜索走 REST fallback');
    return null;
  }
  try {
    tavilyClient = await createMCPClient({ transport: { type: 'http', url } });
    const tools = (await tavilyClient.tools()) as ToolSet;
    log.info(`✅ Tavily MCP 已连接，注入 ${Object.keys(tools).length} 个工具: ${Object.keys(tools).join(', ')}`);
    return tools;
  } catch (err) {
    log.error(`Tavily MCP 连接失败（${err instanceof Error ? err.message : String(err)}），回退 REST 搜索`);
    tavilyClient = null;
    return null;
  }
}

export async function closeMcp(): Promise<void> {
  await tavilyClient?.close();
  tavilyClient = null;
}
