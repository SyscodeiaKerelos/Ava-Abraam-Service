export interface UserPermissions {
  canViewDashboard: boolean;
  canViewZones: boolean;
  canCreateZones: boolean;
  canEditZones: boolean;
  canDeleteZones: boolean;
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canManageSettings: boolean;
}

export const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  super_admin: {
    canViewDashboard: true,
    canViewZones: true,
    canCreateZones: true,
    canEditZones: true,
    canDeleteZones: true,
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewReports: true,
    canExportData: true,
    canManageSettings: true,
  },
  admin: {
    canViewDashboard: true,
    canViewZones: true,
    canCreateZones: true,
    canEditZones: true,
    canDeleteZones: false,
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewReports: true,
    canExportData: true,
    canManageSettings: false,
  },
  viewer: {
    canViewDashboard: true,
    canViewZones: true,
    canCreateZones: false,
    canEditZones: false,
    canDeleteZones: false,
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewReports: false,
    canExportData: false,
    canManageSettings: false,
  },
};
