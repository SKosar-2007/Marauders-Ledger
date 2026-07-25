import { useQuery } from '@tanstack/react-query'
import { getNarrative } from '../services/api'

export function useNarrative(anomalyId: string) {
  return useQuery({
    queryKey: ['narrative', anomalyId],
    queryFn: () => getNarrative(anomalyId),
    enabled: !!anomalyId,
  })
}
