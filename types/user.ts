export type UserRole = 'admin' | 'engineer' | 'dealer';
export type UserStatus = 'active' | 'pending' | 'deactivated';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  company?: string;
  lastLogin?: string;
  createdAt: string;
}
