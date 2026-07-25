import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { uploadCSV, analyzeBatch, getAnomalies, getBatchStatus } from '../services/api'

const POLL_INTERVAL = 1000
const MAX_POLLS = 60

export function useUploadAndAnalyze() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const batch = await uploadCSV(file)

      // Poll for batch completion (Celery background task)
      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL))
        const status = await getBatchStatus(batch.batch_id)
        if (status.status === 'completed' || status.status === 'failed') {
          return { ...batch, ...status }
        }
      }

      // Fallback: try synchronous analyze if polling times out
      try {
        const result = await analyzeBatch(batch.batch_id)
        return { ...batch, ...result }
      } catch {
        return { ...batch, status: 'processing' }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] })
      queryClient.invalidateQueries({ queryKey: ['spending-day'] })
      queryClient.invalidateQueries({ queryKey: ['spending-category'] })
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useAnomalies(severity?: string) {
  return useQuery({
    queryKey: ['anomalies', severity],
    queryFn: async () => {
      const res = await getAnomalies(severity)
      return res.items
    },
  })
}
