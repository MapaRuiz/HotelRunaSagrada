// src/app/shared/utils/roles.ts
import { RoleEntity } from '../model/user';

export function roleNames(roles?: (RoleEntity | string)[]) : string[] {
  if (!Array.isArray(roles)) return [];
  return roles.map(r => typeof r === 'string' ? r : r.name);
}
