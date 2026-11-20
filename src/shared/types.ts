export type Phase = 'idle' | 'discovering' | 'ready' | 'starting' | 'running' | 'paused' | 'stopping' | 'error'
export type SignalValue = { value: number; confidence: number | null; stable: boolean | null; timestamp: number }
export type SessionSnapshot = { phase: Phase; sensorStatus: string; processingStatus: number | null; cameraName: string | null; cameraCount: number; validation: { code: number; hint: string } | null; error: string | null; pulse: SignalValue | null; breathing: SignalValue | null; hrv: SignalValue | null; startedAt: number | null; paused: boolean }
export type CameraInfo = { id: string; name: string; facing: string }
export type SessionSummaryData = { durationSeconds: number; validSeconds: number; coveragePercent: number; averagePulse: number | null; averageBreathing: number | null; averageHrv: number | null; pulseSamples: number; breathingSamples: number; hrvSamples: number }
export interface PaceBridge { discover(): Promise<{ cameras: CameraInfo[]; error: string | null }>; start(cameraId: string): Promise<{ ok: boolean; error?: string }>; finish(): Promise<SessionSummaryData>; stop(): Promise<void>; getSnapshot(): Promise<SessionSnapshot>; subscribe(listener: (snapshot: SessionSnapshot) => void): () => void; openExternal(url: string): Promise<void> }
declare global { interface Window { pace: PaceBridge } }
