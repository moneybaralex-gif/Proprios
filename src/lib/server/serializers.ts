export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));
}
