import { useQuery } from '@tanstack/react-query'
import { getSpendingByDay, getSpendingByCategory } from '../services/api'

export function useSpendingByDay() {
  return useQuery({
    queryKey: ['spending-day'],
    queryFn: () => getSpendingByDay(),
  })
}

export function useSpendingByCategory() {
  return useQuery({
    queryKey: ['spending-category'],
    queryFn: () => getSpendingByCategory(),
  })
}
