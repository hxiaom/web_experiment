export function toCsv<T extends Record<string, unknown>>(rows: T[], headers: string[]): string {
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[,"\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

export function toNdjson<T>(rows: T[]): string {
  return rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
}

