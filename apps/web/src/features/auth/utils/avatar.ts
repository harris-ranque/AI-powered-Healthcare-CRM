type AvatarSource = {
  name?: string | null;
  email?: string | null;
};

export function getInitials(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || email?.split('@')[0] || '';
  if (!source) {
    return 'U';
  }
  const parts = source.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function getAvatarUrl(user: AvatarSource): string {
  const seed = (user.name && user.name.trim()) || user.email || 'user';
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&radius=50`;
}
