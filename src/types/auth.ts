export type UserRole = 'admin' | 'supervisor' | 'agent' | 'manager';

export interface UserScopes {
  extensions: string[];
  queues: string[];
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  scopes: UserScopes;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  role: UserRole;
  scopes?: UserScopes;
}
