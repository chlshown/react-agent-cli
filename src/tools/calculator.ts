import { tool } from 'ai';
import { z } from 'zod';
import { evaluate } from 'mathjs';

// 计算器：用 mathjs 而不是 eval，避免任意代码执行（工具安全，面试考点）
export const calculator = tool({
  description: '数学计算。支持四则运算、幂(^)、sqrt、log、sin/cos、百分比等。表达式示例："sqrt(2)^3 * 12"。',
  inputSchema: z.object({
    expression: z.string().describe('数学表达式'),
  }),
  execute: async ({ expression }) => {
    try {
      const result = evaluate(expression);
      return `${expression} = ${typeof result === 'number' ? Number(result.toPrecision(12)) : String(result)}`;
    } catch (err) {
      return `计算失败：${err instanceof Error ? err.message : String(err)}`;
    }
  },
});
