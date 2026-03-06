export function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}
