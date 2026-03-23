export interface Organization {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  tier: "hobby" | "pro" | "enterprise";
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
  };
}
