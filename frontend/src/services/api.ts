import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export const uploadCSV = async (file: File) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post('/upload', form)
  return data as { batch_id: string; status: string; txn_count: number }
}

export const analyzeBatch = async (batchId: string) => {
  const { data } = await client.post(`/analyze?batch_id=${batchId}`)
  return data as { anomalies_found: number; total_txns: number; status: string }
}

export const getAnomalies = async (userId: string) => {
  const { data } = await client.get(`/anomalies?user_id=${userId}`)
  return data as Array<{
    anomaly_id: string
    txn_id?: string
    amount: number
    category: string
    merchant: string
    hour: number
    day?: number
    isolation_score: number
    rule_score: number
    final_score: number
    is_anomaly: boolean
    severity: 'low' | 'medium' | 'high' | 'none'
    triggered_rules: string[]
    detected_at?: string
  }>
}

export const getNarrative = async (anomalyId: string) => {
  const { data } = await client.get(`/narratives/${anomalyId}`)
  return data as { narrative_id: string; anomaly_id: string; text: string; created_at?: string }
}

export const getAudio = async (anomalyId: string) => {
  const { data } = await client.get(`/narratives/${anomalyId}/audio`, { responseType: 'blob' })
  return data as Blob
}

export const getHealth = async () => {
  const { data } = await client.get('/health')
  return data as { status: string; version: string }
}

export const setAnomalyStatus = async (anomalyId: string, status: string) => {
  const { data } = await client.post(`/anomalies/${anomalyId}/status?status=${status}`)
  return data as { anomaly_id: number; status: string }
}

export const getSpendingByCategory = async (userId: string) => {
  const { data } = await client.get(`/spending/category?user_id=${userId}`)
  return data as Array<{ category: string; total: number }>
}

export const getSpendingByDay = async (userId: string) => {
  const { data } = await client.get(`/spending/daily?user_id=${userId}`)
  return data as Array<{ day: string; amount: number }>
}
