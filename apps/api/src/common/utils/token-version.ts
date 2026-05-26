export function readTokenVersion(user: object | null | undefined): number {
  if (!user) {
    return 0;
  }

  const stored = (user as Record<string, unknown>)['tokenVersion'];
  return typeof stored === 'number' ? stored : 0;
}

export function matchesTokenVersion(
  user: object,
  tokenVersion: number,
): boolean {
  return readTokenVersion(user) === tokenVersion;
}

export function sessionRevocationUpdate(user: object | null | undefined): {
  hashedRefreshToken: null;
  tokenVersion: number;
} {
  return {
    hashedRefreshToken: null,
    tokenVersion: readTokenVersion(user) + 1,
  };
}
