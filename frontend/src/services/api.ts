import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('marauders_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('marauders_token')
      localStorage.removeItem('marauders_session')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export const registerUser = async (name: string, email: string, password: string) => {
  const { data } = await client.post('/auth/register', { name, email, password })
  return data as { access_token: string; user: { user_id: number; name: string; email: string } }
}

export const loginUser = async (email: string, password: string) => {
  const { data } = await client.post('/auth/login', { email, password })
  return data as { access_token: string; user: { user_id: number; name: string; email: string } }
}

export const getMe = async () => {
  const { data } = await client.get('/auth/me')
  return data as { user_id: number; name: string; email: string }
}

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

export const getAnomalies = async (severity?: string) => {
  const params = severity ? `?severity=${severity}` : ''
  const { data } = await client.get(`/anomalies${params}`)
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

export const getAnomaly = async (anomalyId: string) => {
  const { data } = await client.get(`/anomalies/${anomalyId}`)
  return data as {
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
  }
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

export const getSpendingByCategory = async () => {
  const { data } = await client.get('/spending/category')
  return data as Array<{ category: string; total: number }>
}

export const getSpendingByDay = async () => {
  const { data } = await client.get('/spending/daily')
  return data as Array<{ day: string; amount: number }>
}

export const getBatches = async () => {
  const { data } = await client.get('/batches')
  return data as Array<{ batch_id: string; txn_count: number; status: string; created_at: string }>
}

export const getTransactions = async () => {
  const { data } = await client.get('/transactions')
  return data as Array<{ txn_id: number; amount: number; category: string; merchant: string; hour: number; day: number; batch_id: string }>
}
