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
    },
  })
}

export function useAnomalies(userId: string) {
  return useQuery({
    queryKey: ['anomalies', userId],
    queryFn: () => getAnomalies(userId),
    enabled: !!userId,
  })
}
