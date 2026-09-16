export type Cycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'trial' | 'cancelled';

export const CYCLES: Cycle[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

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

export type DetectionStatus = 'pending' | 'confirmed' | 'ignored' | 'filtered';

export interface Detection {
  id: string;
  emailId: string;
  from: string | null;
  subject: string | null;
  snippet: string | null;
  /** Everything below is what the parser extracted from the email. */
  service: string | null;
  category: string | null;
  price: number | null;
  currency: string | null;
  cycle: Cycle | null;
  renewalAt: string | null;
  trialEndsAt: string | null;
  /** 0..1 — how sure the parser is. Drives the "needs a look" hint. */
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
  trialEndsAt?: string | null;
  status: string;
  source: string;
  notes?: string | null;
}

export type UpdateSubscriptionInput = Partial<CreateSubscriptionInput>;

/** Corrections made while reviewing a detection. All optional. */
export interface ConfirmDetectionInput {
  name?: string;
  category?: string;
  price?: number;
  currency?: string;
  cycle?: string;
  nextRenewal?: string;
  trialEndsAt?: string | null;
  status?: string;
}

export interface PollResult {
  scanned: number;
  detected: number;
  filtered: number;
}

/** A discovered "how to cancel" guide for one service. */
export interface CancelGuide {
  id: string;
  serviceName: string;
  cancelUrl: string;
  steps: string[];
}

/** Result of asking for a cancel guide — a concrete guide, or a search fallback. */
export interface CancelGuideResponse {
  guide: CancelGuide | null;
  fallbackUrl: string;
}
