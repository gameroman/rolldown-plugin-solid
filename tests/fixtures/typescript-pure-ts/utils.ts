// Pure TypeScript utility file - no JSX
// This file tests pure TS file handling by Rolldown

// Type definitions
export interface User {
  id?: string;
  name?: string;
  email?: string;
  age?: number;
  isActive?: boolean;
}

export interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  success: boolean;
  error?: string;
}

// Utility functions
export function formatUserName(user: User): string {
  return user.email && user.name
    ? `${user.name} <${user.email}>`
    : user.name || "";
}

export function validateUser(user: User): boolean {
  return !!(user.name && user.id && user.isActive);
}

export function filterActiveUsers(users: User[]): User[] {
  return users.filter((user) => user.isActive);
}

export function calculateUserStats(users: User[]): {
  total: number;
  active: number;
  averageAge: number | null;
} {
  const total = users.length;
  const active = filterActiveUsers(users).length;

  const usersWithAge = users.filter((user) => user.age != null);
  const averageAge =
    usersWithAge.length > 0
      ? usersWithAge.reduce((sum, user) => sum + (user.age || 0), 0) /
        usersWithAge.length
      : null;

  return { total, active, averageAge };
}

// Generic functions
export function createApiResponse<T>(
  data: T[],
  page = 1,
  pageSize = 10,
  error?: string,
): ApiResponse<T> {
  return {
    data,
    total: data.length,
    page,
    pageSize,
    success: !error,
    error,
  };
}

export function paginateData<T>(
  data: T[],
  page: number,
  pageSize: number,
): T[] {
  const startIndex = (page - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
}

// Constants and enums
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export enum UserRole {
  Admin = "admin",
  User = "user",
  Guest = "guest",
}

export enum UserStatus {
  Active = "active",
  Inactive = "inactive",
  Pending = "pending",
  Suspended = "suspended",
}

// Extended interface with enums
export interface ExtendedUser extends User {
  role?: UserRole;
  status?: UserStatus;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Complex utility functions
export function createUserManagementService() {
  const users: ExtendedUser[] = [];

  const addUser = (userData: ExtendedUser): ExtendedUser => {
    const user: ExtendedUser = {
      ...userData,
      id: userData.id || Math.random().toString(36).substr(2, 9),
      createdAt: userData.createdAt || new Date(),
      updatedAt: userData.updatedAt || new Date(),
    };

    users.push(user);
    return user;
  };

  const updateUser = (
    id: string,
    updates: Partial<ExtendedUser>,
  ): ExtendedUser | null => {
    const userIndex = users.findIndex((user) => user.id === id);
    if (userIndex === -1) return null;

    const currentUser = users[userIndex];
    const updatedUser: ExtendedUser = {
      ...currentUser,
      ...updates,
      updatedAt: new Date(),
      id: currentUser?.id || "",
    };

    users[userIndex] = updatedUser;
    return updatedUser;
  };

  const deleteUser = (id: string): boolean => {
    const userIndex = users.findIndex((user) => user.id === id);
    if (userIndex === -1) return false;

    users.splice(userIndex, 1);
    return true;
  };

  const getUsers = (filters?: {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
  }): ExtendedUser[] => {
    let filteredUsers = [...users];

    if (filters?.role) {
      filteredUsers = filteredUsers.filter(
        (user) => user.role === filters.role,
      );
    }

    if (filters?.status) {
      filteredUsers = filteredUsers.filter(
        (user) => user.status === filters.status,
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower),
      );
    }

    return filteredUsers;
  };

  return {
    addUser,
    updateUser,
    deleteUser,
    getUsers,
    getAllUsers: () => [...users],
    getUserCount: () => users.length,
  };
}
