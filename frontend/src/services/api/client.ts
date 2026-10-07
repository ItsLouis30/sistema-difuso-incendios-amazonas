import type {
  ApiErrorBody,
  HistoricalRecord,
  HistoryRange,
  InferenceRequest,
  InferenceResponse,
  ModelResponse,
  RulesResponse,
} from '../../types/api'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = 'UNKNOWN_ERROR',
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(
      'No pudimos conectar con el backend. Comprueba que FastAPI esté ejecutándose.',
      0,
      'NETWORK_ERROR',
    )
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    const detail = body.error?.details?.[0]
    throw new ApiError(
      detail?.message ?? body.error?.message ?? 'La solicitud no pudo completarse.',
      response.status,
      body.error?.code,
    )
  }
  return response.json() as Promise<T>
}

export const api = {
  health: () => request<{ status: string; service: string }>('/health'),
  model: () => request<ModelResponse>('/api/v1/model'),
  rules: () => request<RulesResponse>('/api/v1/rules'),
  historyRange: () => request<HistoryRange>('/api/v1/history/range'),
  historicalRecord: (date: string) =>
    request<HistoricalRecord>(`/api/v1/history/${date}`),
  manualInference: (payload: InferenceRequest, signal?: AbortSignal) =>
    request<InferenceResponse>('/api/v1/inferences', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    }),
  historicalInference: (date: string, signal?: AbortSignal) =>
    request<InferenceResponse>(`/api/v1/inferences/history/${date}`, { signal }),
}
