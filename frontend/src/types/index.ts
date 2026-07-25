export interface Transaction {
  amount: number
  category: string
  merchant: string
  hour: number
  day: number
  timestamp?: string
}

export interface AnomalyResult {
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

export interface BatchResponse {
  batch_id: string
  status: string
  txn_count: number
}

export interface NarrativeResponse {
  narrative_id: string
  anomaly_id: string
  text: string
  created_at?: string
}

export type Severity = 'low' | 'medium' | 'high' | 'none'

export const CATEGORY_MAP: Record<string, { label: string; icon: string; location: string }> = {
  Food: { label: 'Food', icon: 'restaurant', location: 'hogwarts' },
  Shopping: { label: 'Shopping', icon: 'shopping_bag', location: 'hogsmeade' },
  Bills: { label: 'Bills', icon: 'receipt_long', location: 'gringotts' },
  Entertainment: { label: 'Entertainment', icon: 'movie', location: 'diagon' },
  Travel: { label: 'Travel', icon: 'train', location: 'platform' },
}

export const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  high: { label: 'Dementor', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-400' },
  medium: { label: 'Boggart', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-400' },
  low: { label: 'Peeves', color: 'text-stone-600', bg: 'bg-stone-50', border: 'border-stone-400' },
  none: { label: 'Clear', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-400' },
}
