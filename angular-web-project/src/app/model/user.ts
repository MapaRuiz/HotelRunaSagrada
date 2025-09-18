export type Role = 'ADMIN' | 'OPERATOR' | 'CLIENT';

// src/app/model/user.ts
export interface RoleEntity { role_id: number; name: string; }
export interface User {
  user_id: number;
  email: string;
  password?: string;
  full_name: string;
  phone: string;
  national_id: string;
  selected_pet?: string;
  created_at?: string;
  enabled?: boolean;
  roles?: RoleEntity[] | string[];
}
