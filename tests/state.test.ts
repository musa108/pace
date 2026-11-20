import { describe, expect, it } from 'vitest'
import { phaseForProcessingStatus } from '../src/shared/session'

describe('SmartSpectra processing state', () => {
  it('maps documented SDK lifecycle states without claiming readiness early', () => {
    expect(phaseForProcessingStatus(2,'ready')).toBe('starting')
    expect(phaseForProcessingStatus(3,'starting')).toBe('running')
    expect(phaseForProcessingStatus(4,'running')).toBe('stopping')
    expect(phaseForProcessingStatus(5,'running')).toBe('error')
    expect(phaseForProcessingStatus(1,'stopping')).toBe('idle')
  })
  it('retains current phase for unknown SDK values', () => { expect(phaseForProcessingStatus(99,'ready')).toBe('ready') })
})
