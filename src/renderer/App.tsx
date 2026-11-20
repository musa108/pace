import { useEffect, useMemo, useState } from 'react'
import type { CameraInfo, SessionSnapshot, SessionSummaryData } from '../shared/types'
import { validSignal } from '../shared/validation'

const empty: SessionSnapshot = { phase:'idle',sensorStatus:'Not connected',processingStatus:null,cameraName:null,cameraCount:0,validation:null,error:null,pulse:null,breathing:null,hrv:null,startedAt:null,paused:false }
type Page = 'welcome'|'ready'|'session'|'summary'

function formatDuration(seconds:number) { return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}` }
function messageFor(code:number) {
  const hints:Record<number,string>={1:'Move into view so your face is visible.',2:'Make sure only one person is in frame.',3:'Sit in the centre of the camera view.',4:'Move a little farther from the camera.',5:'Find a brighter, evenly lit spot.',6:'Reduce glare or direct light on your face.',7:'Include your upper chest in the frame.',10:'Hold still while the camera adjusts.',11:'Check that the camera has a stable connection.',12:'Settle into a comfortable still position.',13:'Move a little farther from the camera.',14:'Move closer to the camera.',15:'Lower your camera slightly.',16:'Raise your camera slightly.'}
  return hints[code] || 'Sit comfortably, keep your face and upper chest visible, and hold still.'
}

export default function App() {
  const [page,setPage]=useState<Page>('welcome')
  const [snapshot,setSnapshot]=useState(empty)
  const [cameras,setCameras]=useState<CameraInfo[]>([])
  const [cameraId,setCameraId]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [consented,setConsented]=useState(false)
  const [startedAt,setStartedAt]=useState<number|null>(null)
  const [endedAt,setEndedAt]=useState<number|null>(null)
  const [elapsed,setElapsed]=useState(0)
  const [summary,setSummary]=useState<SessionSummaryData|null>(null)
  const [paused,setPaused]=useState(false)

  useEffect(()=>{
    const off=window.pace.subscribe(setSnapshot)
    void window.pace.getSnapshot().then(setSnapshot)
    return off
  },[])
  useEffect(()=>{
    if(!startedAt || page!=='session')return
    const tick=()=>setElapsed(Math.floor((Date.now()-startedAt)/1000))
    tick(); const timer=window.setInterval(tick,1000); return()=>window.clearInterval(timer)
  },[startedAt,page])

  async function prepare(){
    setBusy(true);setError('');setCameras([])
    try { const result=await window.pace.discover(); setCameras(result.cameras); setCameraId(result.cameras[0]?.id||''); if(result.error)setError(result.error) }
    catch { setError('Pace could not check for a camera. Close and reopen the app, then try again.') }
    finally { setBusy(false);setPage('ready') }
  }
  async function begin(){
    if(!consented){setError('Please confirm the camera consent before continuing.');return}
    if(!cameraId){setError('Connect a camera and retry discovery.');return}
    setBusy(true);setError('')
    const result=await window.pace.start(cameraId)
    if(!result.ok){setError(result.error||'Pace could not start the camera session.');setBusy(false);return}
    const now=Date.now();setStartedAt(now);setEndedAt(null);setElapsed(0);setPaused(false);setPage('session');setBusy(false)
  }
  async function finish(){
    setBusy(true);setEndedAt(Date.now())
    try { setSummary(await window.pace.finish()) }
    catch { await window.pace.stop();setSummary({durationSeconds:elapsed,validSeconds:0,coveragePercent:0,averagePulse:null,averageBreathing:null,averageHrv:null,pulseSamples:0,breathingSamples:0,hrvSamples:0}) }
    setBusy(false);setPage('summary')
  }
  function discardSummary(){setSummary(null);setStartedAt(null);setEndedAt(null);setElapsed(0);setPage('welcome')}
  const breathingValid=validSignal(snapshot.breathing,5,40) && Date.now()-snapshot.breathing!.timestamp<15000
  const pulseValid=validSignal(snapshot.pulse,40,110) && Date.now()-snapshot.pulse!.timestamp<15000
  const hrvValid=validSignal(snapshot.hrv,.1,1000) && Date.now()-snapshot.hrv!.timestamp<15000
  const breathText=useMemo(()=>breathingValid?`${Math.round(snapshot.breathing!.value)} breaths/min`:'Waiting for a valid reading', [breathingValid,snapshot.breathing])

  return <main className="shell">
    <header className="topbar"><a className="brand" href="#home" onClick={e=>{e.preventDefault();if(page==='welcome')return;if(page==='session')return;discardSummary()}}><span className="brand-mark"><i/><i/><i/></span><span>pace</span></a><div className="top-meta"><span className="edition">A LITTLE ROOM TO BREATHE</span>{page==='session'&&<span className="live-dot" aria-label="Camera session active"/>}</div></header>
    {page==='welcome'&&<section className="welcome">
      <div className="welcome-copy"><div className="eyebrow"><span className="eyebrow-line"/>A MOMENT, JUST FOR YOU</div><h1>Find your<br/><em>own rhythm.</em></h1><p className="lead">A quieter way to notice your breath. Pace uses your webcam and Presage SmartSpectra to sense breathing and pulse, then lets your own rhythm guide a gentle visual companion.</p>
        <div className="welcome-actions"><button className="primary" onClick={prepare} disabled={busy}>{busy?'Checking your camera':'Begin a session'}<span>↗</span></button><button className="text-button" onClick={()=>document.getElementById('privacy')?.scrollIntoView({behavior:'smooth'})}>A note on privacy <span>↓</span></button></div>
        <div className="trust-row"><span className="mini-lock">◈</span><span>Camera access is opt-in</span><span className="trust-sep">·</span><span>Pace keeps no local session history</span></div>
      </div>
      <div className="hero-art"><div className="halo halo-one"/><div className="halo halo-two"/><div className="hero-orb"><div className="orb-glow"/><div className="orb-core"/></div><div className="art-caption"><span className="caption-rule"/><span>A softer place to land</span></div><span className="orb-label label-top">INHALE</span><span className="orb-label label-bottom">EXHALE</span></div>
      <div className="welcome-bottom"><span>01 / 03</span><span>PAUSE · NOTICE · RETURN</span><span>SCROLL TO EXPLORE ↓</span></div>
      <section className="privacy-strip" id="privacy"><span className="privacy-icon">✳</span><div><h3>Your camera. Your choice.</h3><p>Pace activates the webcam only after your consent and start action. SmartSpectra processes raw frames and face signals on this device; Presage says those are not sent to it. However, SmartSpectra automatically sends derived pulse, breathing and HRV measurements with session metadata to Presage for AI Insights. Presage shares those measurements with Anthropic and stores Insight requests and responses under its SDK privacy policy. This automatic Insights processing cannot currently be turned off. Pace sends no prompt text. Optional diagnostic telemetry is disabled, but this does not stop authentication, model delivery or Insights. Stopping ends camera capture; it cannot retract data already sent to Presage. Pace itself does not save a local session history.</p><span className="privacy-links"><button onClick={()=>window.pace.openExternal('https://presagetech.com/legal/privacy-policy')}>SmartSpectra SDK privacy policy ↗</button><span> · </span><button onClick={()=>window.pace.openExternal('https://smartspectra.presagetech.com/docs/telemetry-and-privacy/')}>Optional telemetry details ↗</button></span></div></section>
      <footer className="footer"><span>PACE © 2026</span><span>WELLNESS COMPANION · NOT A MEDICAL DEVICE</span><span>MADE TO MEET YOU WHERE YOU ARE</span></footer>
    </section>}

    {page==='ready'&&<section className="setup-page"><button className="back" onClick={()=>setPage('welcome')}>← Back</button><div className="setup-card"><div className="eyebrow"><span className="eyebrow-line"/>BEFORE WE BEGIN</div><h2>Let’s make a little space.</h2><p className="setup-lead">Sit somewhere comfortable, with your face and upper chest visible. Soft, steady light helps SmartSpectra find a clear signal.</p><div className="camera-status"><span className={`status-light ${cameras.length?'is-ready':''}`}/><div><strong>{snapshot.sensorStatus}</strong><span>{cameras.length?`${cameras.length} camera${cameras.length===1?'':'s'} found`:'Camera discovery runs only after you continue.'}</span></div><button className="refresh" onClick={prepare} disabled={busy}>↻</button></div>
      {cameras.length>0&&<label className="field-label">CAMERA<select value={cameraId} onChange={e=>setCameraId(e.target.value)}>{cameras.map(c=><option value={c.id} key={c.id}>{c.name} · {c.facing}</option>)}</select></label>}
      <div className="permission-note"><span>◉</span><p>The camera turns on only after you confirm below and start. A small camera indicator stays visible while sensing is active.</p></div>
      <label className="consent"><input type="checkbox" checked={consented} onChange={e=>setConsented(e.target.checked)}/><span>I consent to webcam sensing and understand that SmartSpectra automatically sends derived pulse, breathing and HRV measurements plus session metadata to Presage for AI Insights, shares measurements with Anthropic, and Presage stores Insight requests and responses. This cannot be disabled for an SDK session. Raw video and face signals stay on-device. Pace disables optional diagnostic telemetry and does not save a local session history. I can choose not to start or stop capture at any time. Measurements are for general wellness only, not medical use.</span></label>
      {(error||snapshot.error)&&<div className="error-box" role="alert">{error||snapshot.error}</div>}
      <button className="primary wide" onClick={begin} disabled={busy||!cameras.length||!consented}>{busy?'Connecting…':'Start sensing'}<span>↗</span></button><p className="setup-foot">Your session is never saved automatically.</p></div></section>}

    {page==='session'&&<section className="session-page"><div className="session-heading"><div><div className="eyebrow"><span className="live-dot"/>{snapshot.phase==='running'?'LIVE SESSION':'CONNECTING'}</div><h2>Stay with your<br/><em>own pace.</em></h2></div><div className="duration"><span>SESSION</span><strong>{formatDuration(elapsed)}</strong></div></div>
      <div className="session-grid"><div className={`orb-stage ${!breathingValid?'sensor-wait':''} ${paused?'is-paused':''}`}><div className="ring ring-a"/><div className="ring ring-b"/><div className="session-orb" style={{animationDuration:breathingValid?`${60/snapshot.breathing!.value}s`:undefined,animationName:breathingValid?'breath':'none'}}><div className="session-orb-inner"/><span className="orb-phase">{paused?'PAUSED':breathingValid?'FOLLOW YOUR BREATH':'SETTLING IN'}</span></div><span className="stage-note">{paused?'Take all the time you need':breathingValid?`Visual rhythm follows your measured breathing · ${breathText}`:'The visual will adapt once a valid breathing signal arrives'}</span></div>
        <div className="measurements"><div className="sensor-card"><div className="sensor-label"><span className="signal-icon">⌁</span><span>BREATHING</span><span className={`signal-status ${breathingValid?'valid':''}`}>{breathingValid?'VALID':'WAITING'}</span></div><strong>{breathingValid?Math.round(snapshot.breathing!.value):'—'}<small>{breathingValid?'br/min':''}</small></strong><p>{breathingValid?`Updated ${Math.max(0,Math.round((Date.now()-snapshot.breathing!.timestamp)/1000))}s ago`:snapshot.validation?messageFor(snapshot.validation.code):'A clear reading can take around 30 seconds.'}</p></div>
        <div className="sensor-card"><div className="sensor-label"><span className="signal-icon pulse-icon">♡</span><span>PULSE</span><span className={`signal-status ${pulseValid?'valid':''}`}>{pulseValid?'VALID':'WAITING'}</span></div><strong>{pulseValid?Math.round(snapshot.pulse!.value):'—'}<small>{pulseValid?'bpm':''}</small></strong><p>{pulseValid?`Updated ${Math.max(0,Math.round((Date.now()-snapshot.pulse!.timestamp)/1000))}s ago`:'Pulse is measured when a valid signal is available.'}</p></div>
        <div className="sensor-card"><div className="sensor-label"><span className="signal-icon">∿</span><span>HRV · RMSSD</span><span className={`signal-status ${hrvValid?'valid':''}`}>{hrvValid?'VALID':'WAITING'}</span></div><strong>{hrvValid?Math.round(snapshot.hrv!.value):'—'}<small>{hrvValid?'ms':''}</small></strong><p>{hrvValid?`Updated ${Math.max(0,Math.round((Date.now()-snapshot.hrv!.timestamp)/1000))}s ago`:'HRV needs a longer reading window and may stay unavailable.'}</p></div>
        <div className="quality-note"><span className={`status-light ${snapshot.phase==='running'?'is-ready':''}`}/><div><strong>{snapshot.sensorStatus}</strong><span>{snapshot.validation?(snapshot.validation.code<0?snapshot.validation.hint:messageFor(snapshot.validation.code)):snapshot.phase==='running'?'Camera active · Presage SmartSpectra':'Waiting for SDK readiness'}</span></div></div>
        {snapshot.error&&<div className="error-box" role="alert">{snapshot.error}</div>}
        <div className="session-controls"><button className="secondary" onClick={()=>setPaused(x=>!x)}>{paused?'Resume':'Pause guidance'}</button><button className="end-button" onClick={finish} disabled={busy}>{busy?'Ending…':'End session'}<span>↗</span></button></div>
        <p className="wellness-note">For general wellness and information only. Not for diagnosis or treatment.</p></div></div></section>}

    {page==='summary'&&<section className="summary-page"><div className="summary-top"><div className="eyebrow"><span className="eyebrow-line"/>A MOMENT, HELD</div><h2>Thank you for<br/><em>showing up.</em></h2><p>Pace has not saved a local copy of your session.</p></div><div className="summary-card"><div className="summary-metric"><span>TIME TOGETHER</span><strong>{formatDuration(summary?.durationSeconds||0)}</strong></div><div className="summary-rule"/><div className="summary-metric"><span>AVERAGE BREATHING</span><strong>{summary?.averageBreathing?<>{Math.round(summary.averageBreathing)}<small> br/min</small></>:'—'}</strong></div><div className="summary-rule"/><div className="summary-metric"><span>AVERAGE PULSE</span><strong>{summary?.averagePulse?<>{Math.round(summary.averagePulse)}<small> bpm</small></>:'—'}</strong></div><div className="summary-rule"/><div className="summary-metric"><span>AVERAGE HRV · RMSSD</span><strong>{summary?.averageHrv?<>{Math.round(summary.averageHrv)}<small> ms</small></>:'—'}</strong></div></div><div className="coverage-row"><span>VALID SIGNAL COVERAGE</span><strong>{summary?.coveragePercent||0}%</strong></div><div className="coverage-track"><span style={{width:`${summary?.coveragePercent||0}%`}}/></div><p className="summary-context">Only distinct valid samples received during this session are included. {(!summary?.averageBreathing||!summary?.averagePulse||!summary?.averageHrv)&&'A valid sample was not available for every signal; unavailable signals are left blank.'} Presage's remote processing and retention are described in its SmartSpectra privacy policy.</p><div className="summary-actions"><button className="primary" onClick={()=>{discardSummary();setError('')}}>Return to Pace <span>↗</span></button><button className="text-button" onClick={()=>{setSummary(null);setStartedAt(null);setEndedAt(null);void prepare()}}>Begin another session <span>↗</span></button></div><p className="discard-note">Returning discards Pace’s local summary. It cannot delete data already sent to Presage.</p></section>}
    <div className="disclaimer">Camera-based physiological signals are estimates for general wellness only. Not intended for medical use.</div>
  </main>
}
