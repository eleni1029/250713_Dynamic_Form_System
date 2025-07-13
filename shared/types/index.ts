// 用戶相關類型
export interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  email?: string;
  isActive: boolean;
  isAdmin?: boolean;
  authProvider?: 'local' | 'google' | 'guest';
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  name: string;
  password: string;
  email?: string;
}

export interface GoogleAuthData {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface GuestLoginData {
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  permissions: string[];
}

// 專案相關類型
export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  component: string;
  enabled: boolean;
  isPublic: boolean; // 新增：是否公開使用
  version: string;
  author: string;
  category: string;
  requiredPermissions: string[];
  metadata: ProjectMetadata;
}

export interface ProjectMetadata {
  saveLastInput: boolean;
  saveHistory: boolean;
  maxInputFields: number;
}

export interface ProjectCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// 權限相關類型
export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface UserPermission {
  userId: string;
  permissionId: string;
  grantedBy: string;
  grantedAt: Date;
}

// 表單數據類型
export interface FormData {
  id: string;
  userId: string;
  projectId: string;
  data: Record<string, any>;
  createdAt: Date;
  isLatest: boolean;
}

// API 響應類型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 操作記錄類型
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// BMI 計算器類型
export interface BMIData {
  height: number; // 身高 (cm)
  weight: number; // 體重 (kg)
}

export interface BMIResult extends BMIData {
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese';
  categoryText: string;
}

// TDEE 計算器類型
export interface TDEEData {
  age: number;
  gender: 'male' | 'female';
  height: number; // 身高 (cm)
  weight: number; // 體重 (kg)
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
}

export interface TDEEResult extends TDEEData {
  bmr: number; // 基礎代謝率
  tdee: number; // 每日總能量消耗
  activityMultiplier: number;
}

// 錯誤類型
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}