import type {
  ApiResponse,
  CreateSubscriptionInput,
  Detection,
  Subscription,
} from './types';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.47:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
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
  deleteSubscription: (id: string) =>
    request<Subscription>(`/subscriptions/${id}`, { method: 'DELETE' }),

  listDetections: () => request<Detection[]>('/detections'),
  confirmDetection: (id: string) =>
    request<Detection>(`/detections/${id}/confirm`, { method: 'POST' }),
  ignoreDetection: (id: string) =>
    request<Detection>(`/detections/${id}/ignore`, { method: 'POST' }),
};
