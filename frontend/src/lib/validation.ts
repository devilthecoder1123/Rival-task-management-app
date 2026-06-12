export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidDate(value: string) {
  return value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}
