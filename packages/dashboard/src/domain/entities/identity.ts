export interface UserSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  lastActiveAt: string;
  isCurrent: boolean;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
}

export interface UserSecurityStatus {
  mfaEnabled: boolean;
  mfaType: "totp" | "sms" | "email" | "hardware";
  lastPasswordChange: string;
  recoveryEmail?: string;
  activeSessions: UserSession[];
}

export interface PersonalAuditLog {
  id: string;
  timestamp: string;
  action: string;
  status: "success" | "failed";
  ipAddress: string;
}
