export function truncateWithEllipsis(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}
