import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import type { ModelMessage } from 'ai';
import { runAgent } from './agent.js';
import { buildTools } from './tools/index.js';
import { closeMcp } from './mcp.js';
import { log } from './logger.js';

const BANNER = `
\x1b[1m🤖 ReAct 研究助手 CLI\x1b[0m
命令：/exit 退出 · /reset 清空对话历史
试试："搜一下 Vercel AI SDK 5 的 stopWhen 用法，写份笔记存到 workspace，再给我总结"
`;

async function main() {
  console.log(BANNER);

  // 启动时构建工具集（异步：会尝试连接 Tavily MCP，失败则回退 REST）
  const tools = await buildTools();
  log.info(`工具就绪：${Object.keys(tools).join(', ')}`);

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const messages: ModelMessage[] = [];
  process.stdout.write('\n\x1b[1m你 ›\x1b[0m ');

  // for-await 迭代 readline：stdin 关闭（EOF/管道输入结束）时自然退出，不会崩
  for await (const raw of rl) {
    const input = raw.trim();
    if (!input) continue;
    if (input === '/exit' || input === '/quit') break;
    if (input === '/reset') {
      messages.length = 0;
      log.info('对话历史已清空');
      continue;
    }
    log.info('Agent ›');
    await runAgent(messages, input, tools);
    process.stdout.write('\n\x1b[1m你 ›\x1b[0m ');
  }

  rl.close();
  await closeMcp(); // 关闭 MCP 连接，避免进程挂起
  log.info('再见 👋');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
