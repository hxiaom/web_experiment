export async function readJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(`服务器返回空内容（HTTP ${res.status}）`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.replace(/\s+/g, " ").slice(0, 160);
    throw new Error(`服务器返回的不是有效 JSON（HTTP ${res.status}）：${preview}`);
  }
}
