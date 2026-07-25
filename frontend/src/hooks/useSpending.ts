import { useQuery } from '@tanstack/react-query'
import { getSpendingByDay, getSpendingByCategory } from '../services/api'

export function useSpendingByDay(userId: string) {
  return useQuery({
    queryKey: ['spending-day', userId],
    queryFn: () => getSpendingByDay(userId),
    enabled: !!userId,
  })
}

export function useSpendingByCategory(userId: string) {
  return useQuery({
    queryKey: ['spending-category', userId],
    queryFn: () => getSpendingByCategory(userId),
    enabled: !!userId,
  })
}
