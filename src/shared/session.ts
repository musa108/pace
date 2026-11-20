import type { Phase } from './types'
export function phaseForProcessingStatus(status: number, current: Phase): Phase {
  switch (status) {
    case 1: return 'idle'
    case 2: return 'starting'
    case 3: return 'running'
    case 4: return 'stopping'
    case 5: return 'error'
    default: return current
  }
}
