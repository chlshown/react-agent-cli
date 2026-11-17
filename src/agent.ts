import { streamText, stepCountIs, type ModelMessage, type ToolSet } from 'ai';
import { model, maxSteps } from './config.js';
import { log } from './logger.js';

/**
 * ═══════════════════════════════════════════════════════════
 *  Agent Loop（ReAct 循环）—— 面试必考，能手写伪代码：
 *
 *  messages = [system, ...history, user]
 *  loop (最多 maxSteps 步):
 *    1. LLM 推理:  stream = streamText(messages, tools)
 *    2. 若 LLM 发起 tool-call → 执行工具 → 结果作为 tool message 回填 messages → 回到 1
 *    3. 若 LLM 直接输出文本（无 tool-call）→ 任务完成，退出循环
 *
 *  Vercel AI SDK 用 stopWhen: stepCountIs(n) 自动跑这个循环，
 *  这里通过 fullStream 把每一步"摊开"打印，方便观察推理过程。
 * ═══════════════════════════════════════════════════════════
 */
const SYSTEM_PROMPT = `你是一个研究型助手（ReAct 模式），运行在 CLI 中。
工作方式：
1. 先思考需要什么信息，再调用工具（Reason → Act → Observe 循环）；
2. 需要联网信息时优先用搜索类工具（如 tavily-search / webSearch）；搜到链接后用抓取/提取类工具（fetchPage 或 tavily-extract）读全文，不要只看摘要就下结论；
3. 复杂任务先把研究笔记用 writeFile 存到 workspace/，最后汇总；
4. 工具失败时分析原因，换关键词或换工具重试，不要重复同一调用超过 2 次；
5. 最终回答用中文，给出来源链接；不确定就明说，不要编造。`;

export async function runAgent(messages: ModelMessage[], userInput: string, tools: ToolSet): Promise<void> {
  messages.push({ role: 'user', content: userInput });

  let stepCount = 0;
  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages,
    tools,
    stopWhen: stepCountIs(maxSteps), // 防失控循环：最多 maxSteps 步
    onStepFinish: () => {
      stepCount++;
      log.step(stepCount);
    },
  });

  try {
    for await (const part of result.fullStream) {
      switch (part.type) {
        case 'text-delta':
          process.stdout.write(part.text); // 流式输出
          break;
        case 'tool-call':
          log.toolCall(part.toolName, part.input);
          break;
        case 'tool-result': {
          // 不同 SDK 版本结果字段名不同（result / output），做兼容
          const p = part as { result?: unknown; output?: unknown };
          log.toolResult(part.toolName, true, p.result ?? p.output);
          break;
        }
        case 'tool-error':
          log.toolResult(part.toolName, false, part.error);
          break;
        case 'error':
          log.error(`stream error: ${JSON.stringify(part.error)}`);
          break;
      }
    }
    process.stdout.write('\n');

    // 把本轮完整对话（含工具调用）回填历史，支持多轮上下文
    const response = await result.response;
    messages.push(...response.messages);
  } catch (err) {
    log.error(`Agent 执行失败：${err instanceof Error ? err.message : String(err)}`);
    // 失败时清掉半截的 user 消息，保持历史干净可重试
    if (messages.at(-1)?.role === 'user') messages.pop();
  }

  if (stepCount >= maxSteps) {
    log.info(`⚠️ 达到最大步数 ${maxSteps}，已强制停止（可调大 .env 中 MAX_STEPS）`);
  }
}
