import { SmartSpectraSDK, CameraSelection, breathingMetrics, cardioMetrics, decodeMetrics, setMetricsClass } from '@smartspectra/node-sdk'
import { presage } from '@smartspectra/node-sdk/messages'
import type { CameraInfo, SessionSnapshot, SignalValue } from '../shared/types'
import { latestValidSample } from '../shared/validation'
import { phaseForProcessingStatus } from '../shared/session'
type MetricPacket = { breathing?: { rate?: unknown[] }; cardio?: { pulseRate?: unknown[]; hrv?: Array<{rmssd?:number;confidence?:number;stable?:boolean;timestamp?:number}> } }
type Listener = (snapshot: SessionSnapshot) => void
setMetricsClass(presage.smartspectra.Metrics)
const initial: SessionSnapshot = { phase:'idle', sensorStatus:'Not connected', processingStatus:null, cameraName:null, cameraCount:0, validation:null, error:null, pulse:null, breathing:null, hrv:null, startedAt:null, paused:false }
export class SmartSpectraController {
  private sdk: SmartSpectraSDK | null = null
  private snapshot: SessionSnapshot = { ...initial }
  private listeners = new Set<Listener>()
  private pulseSamples = new Map<number, SignalValue>()
  private breathingSamples = new Map<number, SignalValue>()
  private hrvSamples = new Map<number, SignalValue>()
  private live = false
  private discovered = new Map<string, string>()
  getSnapshot = () => this.snapshot
  subscribe = (listener: Listener) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  private update(patch: Partial<SessionSnapshot>) { this.snapshot = { ...this.snapshot, ...patch }; for (const listener of this.listeners) listener(this.snapshot) }
  discover(): { cameras: CameraInfo[]; error: string | null } {
    this.update({ phase:'discovering', sensorStatus:'Checking camera access…', error:null })
    try {
      const cameras = SmartSpectraSDK.availableCameras().map(c => ({ id:c.id, name:c.name || 'Camera', facing:c.facing }))
      this.discovered = new Map(cameras.map(camera => [camera.id, camera.name]))
      const error = cameras.length ? null : 'No camera was found. Connect a webcam, enable Windows camera access for desktop apps, then retry.'
      this.update({ phase:cameras.length ? 'ready':'error', sensorStatus:cameras.length ? 'Camera ready':'No camera found', cameraCount:cameras.length, error })
      return { cameras, error }
    } catch {
      const error = 'Camera discovery is unavailable. Check Windows camera privacy settings and try again.'
      this.update({ phase:'error', sensorStatus:'Camera unavailable', error }); return { cameras:[], error }
    }
  }
  async start(cameraId: string): Promise<{ ok:boolean; error?:string }> {
    if (typeof cameraId !== 'string' || cameraId.length < 1 || cameraId.length > 512 || !this.discovered.has(cameraId)) return { ok:false, error:'Choose a camera from the current discovery list and retry.' }
    if (this.live) return { ok:false, error:'A session is already active.' }
    const apiKey = process.env.PRESAGE_API_KEY?.trim()
    if (!apiKey || apiKey === 'your_key_here') { const error='Presage API key is missing. Add PRESAGE_API_KEY to Pace’s .env file in your Windows user profile, or set it in the launch environment, then restart Pace.'; this.update({phase:'error',sensorStatus:'Setup required',error}); return {ok:false,error} }
    this.update({phase:'starting',sensorStatus:'Connecting to SmartSpectra…',error:null,pulse:null,breathing:null,hrv:null,validation:null,paused:false})
    this.pulseSamples.clear(); this.breathingSamples.clear(); this.hrvSamples.clear()
    try {
      const sdk = new SmartSpectraSDK({apiKey,requestedMetrics:[...breathingMetrics,...cardioMetrics],enableTelemetry:false})
      this.sdk=sdk
      sdk.on('processingStatus', status => { const phase=phaseForProcessingStatus(status,this.snapshot.phase); if(phase==='running') this.live=true; if(phase==='error') this.live=false; this.update({processingStatus:status,phase,sensorStatus:status===3?'SmartSpectra is measuring':status===5?'Sensor error':this.snapshot.sensorStatus}) })
      sdk.on('validationStatus', (code,_ts,hint) => this.update({validation:{code,hint:String(hint).slice(0,200)}, ...(code === 0 ? {} : {pulse:null,breathing:null,hrv:null})}))
      sdk.on('metrics', (buffer,ts) => this.receiveMetrics(buffer,ts))
      sdk.on('error', (code,message) => { this.live=false; const error=this.friendlyError(code,message); this.update({phase:'error',sensorStatus:'Sensor error',error,pulse:null,breathing:null,hrv:null}) })
      sdk.useCamera(CameraSelection.byId(cameraId))
      this.update({sensorStatus:'Checking SmartSpectra readiness…'})
      const readiness=await sdk.checkDeviceReadiness()
      if(readiness.verdict==='blocked') {
        const error=readiness.reason || 'SmartSpectra readiness is blocked. Check account access, camera permission, and configuration.'
        this.update({phase:'error',sensorStatus:'Readiness blocked',error})
        await sdk.destroy(); this.sdk=null
        return {ok:false,error}
      }
      if(readiness.verdict!=='ready') this.update({validation:{code:-1,hint:readiness.reason},sensorStatus:`Readiness ${readiness.verdict}`})
      sdk.start(); this.live=true
      const processingStatus=sdk.processingStatus
      const phase=phaseForProcessingStatus(processingStatus,this.snapshot.phase)
      this.update({phase,sensorStatus:phase==='running'?'SmartSpectra is measuring':'Starting SmartSpectra…',startedAt:Date.now(),cameraName:this.discovered.get(cameraId) ?? 'Camera',processingStatus})
      return {ok:true}
    } catch(cause) { this.live=false; const error=this.friendlyError((cause as {code?:number})?.code,(cause as Error)?.message); this.update({phase:'error',sensorStatus:'Could not start',error,pulse:null,breathing:null}); await this.release(); return {ok:false,error} }
  }
  private receiveMetrics(buffer: Buffer, timestampUs: number) {
    let decoded:unknown; try { decoded=decodeMetrics(buffer) } catch { return }
    if(!decoded || Buffer.isBuffer(decoded)) return
    const packet=decoded as MetricPacket; const ts=Number.isFinite(timestampUs)?timestampUs/1000:Date.now()
    const pulse=latestValidSample<{value:number;confidence?:number;stable?:boolean;timestamp?:number}>(packet.cardio?.pulseRate,40,110)
    const breathing=latestValidSample<{value:number;confidence?:number;stable?:boolean;timestamp?:number}>(packet.breathing?.rate,5,40)
    const hrv=latestValidSample<{value:number;confidence?:number;stable?:boolean;timestamp?:number}>(packet.cardio?.hrv?.map(sample=>({...sample,value:sample.rmssd??NaN})),0.1,1000)
    const convert=(s:typeof pulse):SignalValue=>({value:s!.value,confidence:s!.confidence??null,stable:s!.stable??null,timestamp:s!.timestamp?Number(s!.timestamp)/1000:ts})
    const p=pulse?convert(pulse):null; const b=breathing?convert(breathing):null; const h=hrv?convert(hrv):null
    if(p)this.pulseSamples.set(p.timestamp,p); if(b)this.breathingSamples.set(b.timestamp,b); if(h)this.hrvSamples.set(h.timestamp,h)
    const fresh=(v:SignalValue|null)=>v&&Date.now()-v.timestamp<15000?v:null
    this.update({pulse:fresh(p),breathing:fresh(b),hrv:fresh(h)})
  }
  private friendlyError(code:unknown,raw?:string) {
    if(code===2)return 'SmartSpectra could not authenticate. Check the Presage API key and account access.'
    if(code===4)return 'This SmartSpectra account has no remaining session credit.'
    if(code===5)return 'Could not reach Presage to authorize the session. Check your internet connection.'
    if(code===7)return 'The camera is unavailable. Enable camera access for desktop apps in Windows privacy settings or close other camera apps, then retry.'
    if(code===13)return 'This account is not authorized for one of the requested measurements.'
    if(code===1)return 'SmartSpectra is in an unexpected session state. End the session and try again.'
    if(code===3)return 'SmartSpectra rejected the configuration. Check the SDK setup and requested metrics.'
    if(code===6)return 'The Presage service returned an error. Wait a moment, then retry.'
    if(code===8)return 'SmartSpectra could not process this camera input. Check framing and lighting, then retry.'
    if(code===14)return 'The camera frame rate stayed too low. Close other camera apps and retry.'
    return 'SmartSpectra could not start. Check camera, network, and API key, then retry.'
  }
  async stop() { this.live=false; this.update({phase:'stopping',sensorStatus:'Ending session…',pulse:null,breathing:null,hrv:null,paused:false}); await this.release(); this.pulseSamples.clear(); this.breathingSamples.clear(); this.hrvSamples.clear(); this.update({phase:'idle',sensorStatus:'Session ended',processingStatus:1,startedAt:null,cameraName:null}) }
  private async release() { const sdk=this.sdk; this.sdk=null; if(!sdk)return; try{await sdk.stopAsync()}catch{} try{await sdk.destroy()}catch{} }
  async shutdown(){await this.release();this.pulseSamples.clear();this.breathingSamples.clear();this.hrvSamples.clear()}
  async finish() {
    const endedAt=Date.now(); const startedAt=this.snapshot.startedAt ?? endedAt
    const durationSeconds=Math.max(0,Math.round((endedAt-startedAt)/1000))
    const pulses=[...this.pulseSamples.values()].filter(x=>x.timestamp>=startedAt&&x.timestamp<=endedAt)
    const breaths=[...this.breathingSamples.values()].filter(x=>x.timestamp>=startedAt&&x.timestamp<=endedAt)
    const hrvs=[...this.hrvSamples.values()].filter(x=>x.timestamp>=startedAt&&x.timestamp<=endedAt)
    const coverageSeconds=new Set([...pulses,...breaths,...hrvs].map(x=>Math.floor((x.timestamp-startedAt)/1000))).size
    const average=(xs:SignalValue[])=>xs.length?xs.reduce((a,x)=>a+x.value,0)/xs.length:null
    const summary={durationSeconds,validSeconds:Math.min(durationSeconds,coverageSeconds),coveragePercent:durationSeconds?Math.min(100,Math.round(coverageSeconds/durationSeconds*100)):0,averagePulse:average(pulses),averageBreathing:average(breaths),averageHrv:average(hrvs),pulseSamples:pulses.length,breathingSamples:breaths.length,hrvSamples:hrvs.length}
    await this.stop(); return summary
  }
}
