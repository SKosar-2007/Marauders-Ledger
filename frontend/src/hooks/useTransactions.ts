import { useQuery } from '@tanstack/react-query'
import { getBatches, getTransactions } from '../services/api'

export function useBatches() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: () => getBatches(),
  })
}

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => getTransactions(),
  })
}
