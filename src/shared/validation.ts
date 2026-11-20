import type { SignalValue } from './types'
export function isFiniteNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) }
export function validSignal(value: unknown, min: number, max: number): value is SignalValue {
  if (!value || typeof value !== 'object') return false
  const s = value as Partial<SignalValue>
  return isFiniteNumber(s.value) && s.value >= min && s.value <= max && s.stable === true && isFiniteNumber(s.confidence) && s.confidence > 0 && isFiniteNumber(s.timestamp)
}
export function latestValidSample<T extends { value: number; confidence?: number; stable?: boolean; timestamp?: number }>(samples: unknown, min: number, max: number): T | null {
  if (!Array.isArray(samples)) return null
  for (let i = samples.length - 1; i >= 0; i -= 1) { const s = samples[i] as T | undefined; if (s && isFiniteNumber(s.value) && s.value >= min && s.value <= max && s.stable === true && isFiniteNumber(s.confidence) && s.confidence > 0 && isFiniteNumber(Number(s.timestamp)) && Number(s.timestamp) > 0) return s }
  return null
}
