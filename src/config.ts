import 'dotenv/config';
import { createOpenAI } from '@ai-sdk/openai';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`缺少环境变量 ${name}，请复制 .env.example 为 .env 并填写。`);
    process.exit(1);
  }
  return v;
}

// 任何 OpenAI 兼容端点均可（DashScope / DeepSeek / Moonshot / OpenAI）
const provider = createOpenAI({
  baseURL: requireEnv('AI_BASE_URL'),
  apiKey: requireEnv('AI_API_KEY'),
});

// 显式用 chat/completions 协议（SDK v2 默认走 /responses，很多兼容网关不支持）
export const model = provider.chat(process.env.AI_MODEL ?? 'qwen-plus');
export const maxSteps = Number(process.env.MAX_STEPS ?? 8);
