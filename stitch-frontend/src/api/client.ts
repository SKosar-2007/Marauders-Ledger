import axios from 'axios'

export const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('omniledger_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let _onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler
}

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('omniledger_token')
      _onUnauthorized?.()
    }
    return Promise.reject(err)
  },
)

export interface LoginResponse {
  access_token: string
  token_type: string
  user: { id: number; email: string; name: string }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await client.post('/auth/login', { email, password })
  return data
}

export interface Batch {
  batch_id: string
  filename: string
  status: string
  uploaded_at: string
  txn_count: number
}

export async function getBatches(): Promise<Batch[]> {
  const { data } = await client.get('/batches')
  return Array.isArray(data) ? data : data?.batches ?? []
}

export interface Anomaly {
  anomaly_id: number
  amount: number
  category: string
  merchant: string
  timestamp: string
  status: string
  triggered_rules: string[]
  score?: number
  narrative?: string
}

function fromBackendAnomaly(raw: any): Anomaly {
  const rawScore = raw.final_score ?? raw.score ?? 0
  return {
    anomaly_id: Number(raw.anomaly_id),
    amount: raw.amount,
    category: raw.category,
    merchant: raw.merchant,
    timestamp: raw.detected_at || raw.timestamp || '',
    status: raw.status || 'pending',
    triggered_rules: Array.isArray(raw.triggered_rules) ? raw.triggered_rules : [],
    score: Math.round(rawScore * 100),
  }
}

export async function getAnomalies(params?: { status?: string; limit?: number; offset?: number }): Promise<Anomaly[]> {
  const { data } = await client.get('/anomalies', { params })
  const items: any[] = data?.items ?? data?.anomalies ?? []
  return items.map(fromBackendAnomaly)
}

export async function getAnomaly(id: number): Promise<Anomaly> {
  const { data } = await client.get(`/anomalies/${id}`)
  return fromBackendAnomaly(data)
}

export async function updateAnomalyStatus(id: number, status: string): Promise<void> {
  await client.post(`/anomalies/${id}/status?status=${encodeURIComponent(status)}`)
}

export interface Transaction {
  txn_id: string
  amount: number
  category: string
  merchant: string
  hour: number
  timestamp: string
  batch_id?: string
}

export async function getTransactions(params?: { limit?: number; offset?: number }): Promise<Transaction[]> {
  const { data } = await client.get('/transactions', { params })
  return data.items || []
}

export async function getBatch(id: string): Promise<Batch> {
  const { data } = await client.get(`/batches/${id}`)
  return data
}

export async function uploadCSV(file: File): Promise<{ batch_id: string }> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post('/upload', form)
  return data
}

export async function getSpendingByDay(days?: number) {
  const { data } = await client.get('/spending/daily', { params: { days } })
  return data
}

export async function getSpendingByCategory(): Promise<Array<{ category: string; total: number }>> {
  const { data } = await client.get('/spending/category')
  return data
}

export interface NarrativeResponse {
  narrative_id: string
  anomaly_id: string
  text: string
  created_at?: string
}

export async function getNarrative(anomalyId: number): Promise<NarrativeResponse> {
  const { data } = await client.get(`/narratives/${anomalyId}`)
  return data
}

export async function getNarrativeAudio(anomalyId: number): Promise<Blob> {
  const { data } = await client.get(`/narratives/${anomalyId}/audio`, { responseType: 'blob' })
  return data
}

export type NarrativeSeverity = 'low' | 'medium' | 'high' | 'critical'

export const SEVERITY_CONFIG: Record<NarrativeSeverity, { label: string; icon: string; color: string; bg: string }> = {
  low: { label: 'Low', icon: 'info', color: 'text-tertiary-fixed', bg: 'bg-tertiary-fixed/20 border-tertiary-fixed' },
  medium: { label: 'Medium', icon: 'info', color: 'text-secondary-container', bg: 'bg-secondary-container/20 border-secondary-container' },
  high: { label: 'High', icon: 'warning', color: 'text-secondary', bg: 'bg-secondary/20 border-secondary' },
  critical: { label: 'Critical', icon: 'warning', color: 'text-error', bg: 'bg-error/20 border-error' },
}
