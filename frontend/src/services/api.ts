import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({ baseURL: API_BASE })

export const uploadCSV = async (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/api/upload', form).then((r) => r.data)
}

export const analyzeBatch = async (batchId: string) => {
  return client.post(`/api/analyze?batch_id=${batchId}`).then((r) => r.data)
}

export const getAnomalies = async (userId: string) => {
  return client.get(`/api/anomalies?user_id=${userId}`).then((r) => r.data)
}

export const getNarrative = async (anomalyId: string) => {
  return client.get(`/api/narratives/${anomalyId}`).then((r) => r.data)
}

export const getAudio = async (anomalyId: string) => {
  return client.get(`/api/narratives/${anomalyId}/audio`, { responseType: 'blob' }).then((r) => r.data)
}
