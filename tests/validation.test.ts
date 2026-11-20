import { describe, expect, it } from 'vitest'
import { latestValidSample, validSignal } from '../src/shared/validation'

describe('measurement validation', () => {
  it('accepts a fresh finite in-range positive-confidence stable sample', () => {
    expect(validSignal({ value: 15, confidence: 70, stable: true, timestamp: Date.now() }, 5, 40)).toBe(true)
  })
  it('rejects unavailable, NaN, infinite, out-of-range, zero-confidence, and unstable samples', () => {
    for (const value of [null, undefined, { value: NaN, timestamp: 1 }, { value: Infinity, timestamp: 1 }, { value: 4, timestamp: 1 }, { value: 20, confidence: 0, timestamp: 1 }, { value: 20, confidence: 50, stable: false, timestamp: 1 }]) expect(validSignal(value, 5, 40)).toBe(false)
  })
  it('selects the latest valid sample rather than an invalid tail value', () => {
    expect(latestValidSample([{value:12,confidence:45,stable:true,timestamp:1},{value:100,confidence:90,stable:true,timestamp:2}],5,40)?.value).toBe(12)
    expect(latestValidSample([{value:14,confidence:0,stable:true}],5,40)).toBeNull()
  })
})
