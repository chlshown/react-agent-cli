// 统一日志：带时间戳 + ANSI 颜色，工具调用链路可观测（面试考点：可观测性）
const ts = () => new Date().toISOString().slice(11, 23);

const safe = (v: unknown): string => {
  try {
    return v === undefined ? '(no data)' : typeof v === 'string' ? v : JSON.stringify(v) ?? String(v);
  } catch {
    return String(v);
  }
};

const c = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

export const log = {
  toolCall: (name: string, args: unknown) =>
    console.error(`${c.dim(ts())} ${c.cyan(`🔧 tool-call`)} ${c.bold(name)} ${c.dim(safe(args).slice(0, 200))}`),
  toolResult: (name: string, ok: boolean, preview: unknown) =>
    console.error(`${c.dim(ts())} ${ok ? c.green('✅ tool-result') : c.red('❌ tool-error')} ${name} ${c.dim(safe(preview).slice(0, 160).replace(/\n/g, ' '))}`),
  step: (n: number) => console.error(`${c.dim(ts())} ${c.yellow(`── step ${n} ${'─'.repeat(30)}`)}`),
  info: (s: string) => console.error(`${c.dim(ts())} ${c.dim(s)}`),
  error: (s: string) => console.error(`${c.dim(ts())} ${c.red(s)}`),
};
