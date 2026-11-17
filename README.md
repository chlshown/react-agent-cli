# ReAct 研究助手 CLI

> 15 天 AI Agent 转型计划 · 项目 1（D2–D4）：手写 Agent Loop，吃透 tool calling
> 技术栈：TypeScript · Node 22 · Vercel AI SDK 5（OpenAI 兼容端点：DeepSeek/通义/Moonshot/OpenAI）

一个跑在终端里的研究型 Agent：搜索 → 抓取网页 → 计算 → 把笔记写入本地文件 → 汇总回答，全程流式输出、工具调用日志可观测、失败自动重试。

## 快速开始

```bash
npm install
cp .env.example .env   # 填 LLM API key（推荐 DeepSeek）和 Tavily key（免费 1000 次/月）
npm run dev
```

试试：

```
你 › 搜一下 Vercel AI SDK 5 的 stopWhen 用法，读一篇官方文档全文，写份笔记存到 workspace，再给我中文总结
```

命令：`/exit` 退出 · `/reset` 清空多轮历史

## Agent Loop 核心（面试手写版伪代码）

```
messages = [system, ...history, user]
loop (最多 maxSteps 步):
  1. LLM 推理:  stream = streamText(messages, tools)
  2. 若 LLM 发起 tool-call → 执行工具 → 结果作为 tool message 回填 messages → 回到 1
  3. 若 LLM 直接输出文本（无 tool-call）→ 任务完成，退出循环
```

Vercel AI SDK 用 `stopWhen: stepCountIs(n)` 自动执行这个循环；本项目通过消费 `fullStream` 把每一步摊开打印（`src/agent.ts` 有完整注释）。

## 架构

```
src/
├── index.ts        # CLI REPL（多轮历史、/exit、/reset）
├── agent.ts        # ★ Agent Loop：streamText + tools + stopWhen + onStepFinish
├── config.ts       # OpenAI 兼容 provider 配置（env 驱动，可换任意模型）
├── logger.ts       # 工具调用链路日志（可观测性）
├── retry.ts        # 指数退避重试（失败重试）
└── tools/
    ├── search.ts     # Tavily 网页搜索
    ├── fetch.ts      # 网页抓取 → Turndown 转 Markdown（截断防上下文爆炸）
    ├── calculator.ts # mathjs 安全求值（不用 eval，防任意代码执行）
    └── files.ts      # 本地读写，路径强制沙箱在 workspace/（防目录穿越）
```

## 刻意覆盖的面试考点

| 考点 | 落点 |
|---|---|
| Agent loop = LLM → tool call → 结果回填 → 再推理 | `src/agent.ts`，可手写伪代码 |
| maxSteps 防失控循环 | `stopWhen: stepCountIs(n)` + 到顶提示 |
| 流式输出 | `fullStream` 逐 token 写 stdout |
| 工具调用日志 / 可观测性 | `logger.ts`：每个 tool-call/result 带时间戳 |
| 失败重试 | `retry.ts` 指数退避；agent 层失败时回滚半截历史 |
| 工具安全 | calculator 不用 eval；files 沙箱防目录穿越 |
| 上下文工程 | fetchPage 截断 8000 字符，防撑爆上下文 |

## Roadmap

- [ ] 录 demo GIF
- [ ] 项目 2：Agentic RAG 知识库问答
- [ ] 项目 3：多 Agent「需求→代码」工作流（LangGraph.js + MCP）
