/**
 * The subset of the D1 API this app uses. D1Database satisfies it in production;
 * tests use a node:sqlite adapter with the same shape. Always use bound parameters.
 */
export interface Stmt {
  bind(...values: unknown[]): Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes?: number } }>;
}

export interface Db {
  prepare(sql: string): Stmt;
  batch(statements: Stmt[]): Promise<unknown[]>;
}

export const nowIso = () => new Date().toISOString();

export function randomId(prefix: string, bytes = 9): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  const s = Array.from(b, (x) => x.toString(36).padStart(2, "0")).join("").slice(0, bytes * 2);
  return `${prefix}_${s}`;
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function audit(db: Db, actor: string, action: string, target: string | null, details: Record<string, unknown> = {}) {
  await db
    .prepare("INSERT INTO audit_log (actor, action, target, details, at) VALUES (?, ?, ?, ?, ?)")
    .bind(actor, action, target, JSON.stringify(details), nowIso())
    .run();
}

export async function startRun(db: Db, kind: string): Promise<string> {
  const id = randomId("run");
  await db.prepare("INSERT INTO runs (id, kind, status, started_at) VALUES (?, ?, 'running', ?)").bind(id, kind, nowIso()).run();
  return id;
}

export async function finishRun(db: Db, id: string, stats: Record<string, unknown>, error?: string) {
  await db
    .prepare("UPDATE runs SET status = ?, finished_at = ?, stats = ?, error = ? WHERE id = ?")
    .bind(error ? "error" : "ok", nowIso(), JSON.stringify(stats), error ?? null, id)
    .run();
}
