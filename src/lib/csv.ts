export function toCSV(rows: unknown[]): string {
  const preferred = ['fullName', 'email', 'company', 'timestamp'];

  if (!rows || rows.length === 0) return preferred.join(',');

  const keys = Array.from(
    new Set(
      rows.flatMap((r) => Object.keys(r as Record<string, unknown>))
    )
  );
  const header = [
    ...preferred.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !preferred.includes(k)).sort(),
  ];

  const escape = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  return [
    header.join(','),
    ...rows.map((row) =>
      header
        .map((field) => escape((row as Record<string, unknown>)[field]))
        .join(',')
    ),
  ].join('\n');
}

export default toCSV;
