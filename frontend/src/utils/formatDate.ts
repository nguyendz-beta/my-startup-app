export function formatDate(d: string | Date) {
  return new Date(d).toISOString();
}
