/** True when Postgres or PostgREST says a column doesn't exist (usually an unapplied migration). */
export function isMissingColumn(error: { code?: string; message?: string }, column: string): boolean {
  return (error.code === "42703" || error.code === "PGRST204") && (error.message ?? "").includes(column);
}
