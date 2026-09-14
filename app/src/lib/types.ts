export type Cycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'trial' | 'cancelled';

export interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  cycle: Cycle;
  nextRenewal: string;
  trialEndsAt: string | null;
  status: SubscriptionStatus;
  source: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DetectionStatus = 'pending' | 'confirmed' | 'ignored';

export interface Detection {
  id: string;
  emailId: string;
  from: string | null;
  subject: string | null;
  snippet: string | null;
  body: string | null;
  service: string | null;
  price: number | null;
  currency: string | null;
  cycle: string | null;
  trialEndsAt: string | null;
  confidence: number | null;
  status: DetectionStatus;
  subscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface CreateSubscriptionInput {
  name: string;
  category: string;
  price: number;
  currency: string;
  cycle: string;
  nextRenewal: string;
  status: string;
  source: string;
}
