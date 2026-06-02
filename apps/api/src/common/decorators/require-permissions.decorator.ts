import { SetMetadata } from '@nestjs/common';

import { Permission } from '../permissions';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';

/**
 * Declaratively require one or more permissions on a controller or handler.
 *
 * Pairs with `PermissionsGuard`. The user is granted access only when they
 * hold ALL listed permissions (logical AND). The active permissions come
 * from `request.organization.permissions`, populated by
 * `OrganizationContextGuard`.
 *
 * Usage:
 *   @RequirePermissions(Permission.PATIENT_WRITE)
 *   create(...) { ... }
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
