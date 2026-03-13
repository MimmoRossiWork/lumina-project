import React, { useState, useRef } from 'react'
import ActivityModule from './Section3ActivityModule'
import SleepModule from './Section3SleepModule'

export default function Section3ModulePage({ initial = {}, showActivity = true, showSleep = false, onPrev = () => {}, onFinish = () => {} }) {
  const [activityDone, setActivityDone] = useState(!!initial.activityModule)
  const [sleepDone, setSleepDone] = useState(!!initial.sleepModule)
  const [activityPayload, setActivityPayload] = useState(initial.activityModule || null)
  const [sleepPayload, setSleepPayload] = useState(initial.sleepModule || null)

  const activityRef = useRef(null)
  const sleepRef = useRef(null)

  const handleActivityFinish = (payload) => {
    setActivityDone(true)
    setActivityPayload(payload)
    try { localStorage.setItem('questionnaire_activityModule', JSON.stringify(payload)) } catch {}
    // if sleep not required, finish
    if (!showSleep) onFinish({ activityModule: payload, sleepModule: null })
  }

  const handleSleepFinish = (payload) => {
    setSleepDone(true)
    setSleepPayload(payload)
    try { localStorage.setItem('questionnaire_sleepModule', JSON.stringify(payload)) } catch {}
    // if activity not required, finish
    if (!showActivity) onFinish({ activityModule: null, sleepModule: payload })
  }

  // Determine whether the parent-level Continue should be enabled
  const parentCanContinue = ((!showActivity) || activityDone) && ((!showSleep) || sleepDone)

  // When both modules present and parent Continue clicked, validate children and collect payloads
  const handleParentContinue = () => {
    // if only one module required, the child handlers already call onFinish; this path is for both required
    const aPayload = activityRef.current && typeof activityRef.current.validateAndGetPayload === 'function' ? activityRef.current.validateAndGetPayload() : (activityPayload || null)
    const sPayload = sleepRef.current && typeof sleepRef.current.validateAndGetPayload === 'function' ? sleepRef.current.validateAndGetPayload() : (sleepPayload || null)
    // if any returned null => validation failed, abort (errors displayed inside module)
    if (showActivity && !aPayload) return
    if (showSleep && !sPayload) return
    // update local state so future calls are consistent
    if (aPayload) { setActivityDone(true); setActivityPayload(aPayload) }
    if (sPayload) { setSleepDone(true); setSleepPayload(sPayload) }
    // call parent finish
    onFinish({ activityModule: aPayload || null, sleepModule: sPayload || null })
  }

  return (
    <div>
      <h3>Modulo di approfondimento (Sezione 3.1)</h3>
      <p className="small-muted">Completa i moduli richiesti per approfondire Attività fisica / Sonno.</p>
      {showActivity && (
        <div style={{ marginTop: 12 }}>
          <ActivityModule ref={activityRef} initial={(initial.activityModule && initial.activityModule.responses) ? initial.activityModule.responses : {}} onPrev={onPrev} onFinish={handleActivityFinish} showActions={!(showActivity && showSleep)} />
        </div>
      )}

      {showSleep && (
        <div style={{ marginTop: 12 }}>
          <SleepModule ref={sleepRef} initial={(initial.sleepModule && initial.sleepModule.responses) ? initial.sleepModule.responses : {}} onPrev={onPrev} onFinish={handleSleepFinish} showActions={!(showActivity && showSleep)} />
        </div>
      )}

      {/* Single action set when both modules are present, or fallback handled by modules themselves */}
      {showActivity && showSleep && (
        <div className="form-actions" style={{ marginTop: 14 }}>
          <button type="button" className="btn-secondary" onClick={onPrev}>Torna indietro</button>
          <button type="button" className="btn-primary" onClick={handleParentContinue} style={{ marginLeft: 10 }}>{'Continua'}</button>
        </div>
      )}
    </div>
  )
}
