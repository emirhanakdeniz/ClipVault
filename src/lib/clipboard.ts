/**
 * Writes text to the system clipboard. Resolves to false when clipboard
 * access is denied (e.g. non-secure context), letting callers no-op.
 */
export function copyText(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}
