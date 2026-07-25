import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { uploadCSV, analyzeBatch, getAnomalies } from '../services/api'

export function useUploadAndAnalyze() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const batch = await uploadCSV(file)
      const result = await analyzeBatch(batch.batch_id)
      return { ...batch, ...result }
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
    queryFn: () => getAnomalies(severity),
  })
}
