// src/types/rbac.ts
// Role-Based Access Control (RBAC) types

export type UserRole = 'user' | 'manager' | 'admin';

export type UserStatus = 'active' | 'suspended' | 'pending';

/**
 * Extended user profile with admin management fields
 */
export interface AdminUserProfile {
  id: string;
  email: string;
  
  // Profile info
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  
  // Organization
  organization_id: string;
  organization_name: string;
  
  // Role and status
  role: UserRole;
  status: UserStatus;
  
  // Google integration
  google_connected: boolean;
  google_email: string | null;
  google_connected_at: string | null;
  
  // Account info
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  suspension_reason: string | null;
  
  // Products
  active_products: string[]; // Product IDs
  
  // Metadata
  notes: string | null;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  performed_by_user_id: string;
  performed_by_email: string;
  performed_by_role: UserRole;
  
  action_type: 'product_added' | 'product_removed' | 'user_suspended' | 'user_activated' | 
    'role_changed' | 'profile_updated' | 'login_as' | 'user_created' | 'user_deleted';
  
  target_user_id: string | null;
  target_user_email: string | null;
  
  details: Record<string, any>; // JSON details of what changed
  
  ip_address: string | null;
  user_agent: string | null;
  
  created_at: string;
}

/**
 * Permission check result
 */
export interface PermissionCheck {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageProducts: boolean;
  canSuspend: boolean;
  canLoginAs: boolean;
  canManageManagers: boolean;
  canManageAdmins: boolean;
  canViewAuditLogs: boolean;
}

/**
 * Product assignment action
 */
export interface ProductAssignment {
  product_id: string;
  product_name: string;
  assigned_by: string;
  assigned_at: string;
}