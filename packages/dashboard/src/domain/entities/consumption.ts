export interface ConsumptionMetric {
  id: string;
  name: string;
  currentValue: number;
  limitValue: number;
  unit: string;
  status: "normal" | "warning" | "exceeded";
}

export interface ConsumptionHistory {
  timestamp: string;
  value: number;
}

export interface BillingPlan {
  id: string;
  name: string;
  status: "active" | "past_due" | "canceled";
  nextInvoiceDate: string;
  amount: number;
  currency: string;
}

export interface OrganizationConsumption {
  metrics: ConsumptionMetric[];
  history: ConsumptionHistory[];
  plan: BillingPlan;
}
