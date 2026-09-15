export function camelizeRow<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      value,
    ])
  ) as T;
}

export function camelizeRows<T>(rows: Record<string, unknown>[] | null): T[] {
  return (rows ?? []).map((row) => camelizeRow<T>(row));
}

export function snakeizeRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      value,
    ])
  );
}

export function snakeizeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(snakeizeRow);
}