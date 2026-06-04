import { SetMetadata } from '@nestjs/common';

import { Permission } from '../permissions';

export const REQUIRED_ANY_PERMISSIONS_KEY = 'required_any_permissions';

/**
 * Require at least one of the listed permissions (logical OR).
 * Pairs with PermissionsGuard.
 */
export const RequireAnyPermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_ANY_PERMISSIONS_KEY, permissions);
