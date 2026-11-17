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

// 任何 OpenAI 兼容端点均可（DeepSeek / 通义 / Moonshot / OpenAI）
const provider = createOpenAI({
  baseURL: requireEnv('AI_BASE_URL'),
  apiKey: requireEnv('AI_API_KEY'),
});

export const model = provider(process.env.AI_MODEL ?? 'deepseek-chat');
export const maxSteps = Number(process.env.MAX_STEPS ?? 8);
