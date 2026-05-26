export function money(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function dateTime(value: string | Date) {
  return new Date(value).toLocaleString();
}

export function dateOnly(value: string | Date) {
  return new Date(value).toLocaleDateString();
}
