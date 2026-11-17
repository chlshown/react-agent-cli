// 工具执行失败自动重试（指数退避）——加分项：失败重试
export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, baseDelayMs = 500, label = 'tool' }: { retries?: number; baseDelayMs?: number; label?: string } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const delay = baseDelayMs * 2 ** attempt;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw new Error(`[${label}] failed after ${retries + 1} attempts: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}
