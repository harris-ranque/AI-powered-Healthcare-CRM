import { Role } from '../types/role.type';

export function hasRole(userRole: Role | undefined, allowedRoles: Role[]) {
  if (!userRole) {
    return false;
  }

  return allowedRoles.includes(userRole);
}
