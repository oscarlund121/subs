import type {
  ApiResponse,
  CancelGuideResponse,
  ConfirmDetectionInput,
  CreateSubscriptionInput,
  Detection,
  PollResult,
  Subscription,
  UpdateSubscriptionInput,
} from './types';

/**
 * Set EXPO_PUBLIC_API_URL in `.env` to point at your machine on the LAN, e.g.
 * `EXPO_PUBLIC_API_URL=http://192.168.1.47:3000`. The localhost fallback only
 * works in the iOS simulator and on web.
 */
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** Thrown for any failed request so screens can tell the user what went wrong. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const TIMEOUT_MS = 15000;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });
  } catch (err) {
    // Network-level failure: wrong IP, backend not running, no wifi.
    throw new ApiError(
      err instanceof Error && err.name === 'AbortError'
        ? 'The server took too long to respond.'
        : `Can't reach the server at ${BASE_URL}.`,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : String(body.message);
      }
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(message, res.status);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

export const api = {
  listSubscriptions: () => request<Subscription[]>('/subscriptions'),
  createSubscription: (dto: CreateSubscriptionInput) =>
    request<Subscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  updateSubscription: (id: string, dto: UpdateSubscriptionInput) =>
    request<Subscription>(`/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
  deleteSubscription: (id: string) =>
    request<Subscription>(`/subscriptions/${id}`, { method: 'DELETE' }),

  /** The "how to cancel" guide for a subscription (discovered on demand). */
  getCancelGuide: (id: string) =>
    request<CancelGuideResponse>(`/subscriptions/${id}/cancel-guide`),

  listDetections: () => request<Detection[]>('/detections'),
  /** Pass only the fields the user corrected. */
  confirmDetection: (id: string, overrides: ConfirmDetectionInput = {}) =>
    request<Detection>(`/detections/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify(overrides),
    }),
  ignoreDetection: (id: string) =>
    request<Detection>(`/detections/${id}/ignore`, { method: 'POST' }),

  /** Scan the mailbox now instead of waiting for the next background poll. */
  scanEmail: () => request<PollResult>('/email/poll', { method: 'POST' }),
};
