import { useQuery } from '@tanstack/react-query'
import { getAudio } from '../services/api'

export function useAudio(anomalyId: string) {
  return useQuery({
    queryKey: ['audio', anomalyId],
    queryFn: () => getAudio(anomalyId),
    enabled: !!anomalyId,
  })
}
