/** Relative file: URLs resolve as Prisma does — against a schema in /prisma, so ../db/custom.db is repo-root/db. */
export const DATABASE_URL = "file:../db/custom.db";

export function resolveDbPath(url: string = DATABASE_URL): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("file:")) {
    return trimmed.slice("file:".length);
  }
  return trimmed;
}

export function isLocalFileUrl(url: string): boolean {
  return url.trim().startsWith("file:");
}
