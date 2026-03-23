import { Secret } from "./secret";

export interface Project {
  id: string;
  name: string;
  description?: string;
  environments: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lastConnectedAt?: string;
  memberCount?: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: "active" | "archived" | "degraded";
  updatedAt: string;
}
