export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const uuid = generateUUID;

export function safeClone<T>(obj: T): T {
  if (obj === undefined) return undefined as any;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.error("Failed to clone object", e);
    return obj;
  }
}
