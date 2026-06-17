export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false;
  return UUID_REGEX.test(value.trim());
}

