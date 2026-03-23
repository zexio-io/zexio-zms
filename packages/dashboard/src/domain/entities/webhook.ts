export type WebhookStatus = "active" | "failing" | "disabled";

export interface Webhook {
  id: string;
  url: string;
  description: string;
  events: string[];
  status: WebhookStatus;
  lastFiredAt?: string;
  createdAt: string;
  secret: string; // Used for signing
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  statusCode: number;
  duration: number;
  timestamp: string;
}
