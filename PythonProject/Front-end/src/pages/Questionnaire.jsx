import React, { useState, useEffect, useRef, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import './Questionnaire.css'
import { LanguageContext } from '../LanguageContext'
import { AuthContext } from '../AuthContext'
import ProgressBar from '../components/Questionnaire/ProgressBar'
import Section1 from '../components/Questionnaire/Section1'
import Section2 from '../components/Questionnaire/Section2'
import Section2Borderline from '../components/Questionnaire/Section2Borderline'
import Section2Clinical from '../components/Questionnaire/Section2Clinical'
import Section3 from '../components/Questionnaire/Section3'
import ActivityModule from '../components/Questionnaire/Section3ActivityModule'
import Section3ModulePage from '../components/Questionnaire/Section3ModulePage'
import Section4 from '../components/Questionnaire/Section4'
import Section5 from '../components/Questionnaire/Section5'
import Section5Borderline from '../components/Questionnaire/Section5Borderline'
import Section5Critical from '../components/Questionnaire/Section5Critical'
import Section6 from '../components/Questionnaire/Section6'
import Section6Borderline from '../components/Questionnaire/Section6Borderline'
import Section7 from '../components/Questionnaire/Section7'
import Section6Critical from '../components/Questionnaire/Section6Critical'

export default function Questionnaire({
  title = 'Questionario Lumina',
  introduction = 'Benvenuti a Lumina, il primo passo è raccontarci qualcosa di te. Questo questionario ci aiuterà a personalizzare la tua esperienza.',
  onFinishAll = null,
}) {
  const { language } = useContext(LanguageContext)
  const { completeQuestionnaire } = useContext(AuthContext)

  const introTextEn = `The questionnaire aims to analyze individual well-being through a multidimensional and integrated approach. The survey is divided into several sections, which explore specific areas of daily life: nutrition, physical activity and sleep, mental health, perception of physical health, socio-cultural context, and life satisfaction.`

  const instructionsEn = ``

  const totalSteps = 7
  const [step, setStep] = useState(1)
  // counter used to force remount of section components when step changes
  const [enterKey, setEnterKey] = useState(0)
  // helper to change step and increment enterKey atomically so the new section
  // receives an updated key on the same render (forces remount to reset internal state)
  const goToStep = (s) => { setEnterKey(k => k + 1); setStep(s) }
  // ref to the scrollable box so we can scroll to top when changing sections
  const boxRef = useRef(null)

  useEffect(() => {
    // keep legacy behavior: increment on mount for initial render
    setEnterKey(k => k + 1)
  }, [])

  // when enterKey changes (i.e. when we navigate to a new step via goToStep)
  // scroll the questionnaire box to top so the first question is visible
  useEffect(() => {
    // run slightly after render to allow DOM update
    const t = setTimeout(() => {
      try {
        const box = boxRef && boxRef.current
        if (box) {
          // prefer scrollTo if available
          if (typeof box.scrollTo === 'function') box.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
          else box.scrollTop = 0

          // Prefer to scroll to the section title (first h3 inside the form)
          const heading = box.querySelector('.questionnaire-form h3') || box.querySelector('.questionnaire-form')
          if (heading) {
            const HEADER_VISIBLE_OFFSET = 160 // px offset so the heading sits comfortably below any sticky header
            try {
              // If the container is scrollable, prefer to scroll the container so the heading is visible inside it
              const boxRect = box.getBoundingClientRect()
              const headingRect = heading.getBoundingClientRect()
              // compute heading top relative to container scroll
              const relativeTop = (box.scrollTop || 0) + (headingRect.top - boxRect.top)
              if (typeof box.scrollTo === 'function') {
                box.scrollTo({ top: Math.max(0, relativeTop - HEADER_VISIBLE_OFFSET), left: 0, behavior: 'smooth' })
              } else {
                // fallback to window scrolling if container scroll not available
                const absoluteTop = (window.scrollY || window.pageYOffset) + headingRect.top
                const target = Math.max(0, absoluteTop - HEADER_VISIBLE_OFFSET)
                window.scrollTo({ top: target, left: 0, behavior: 'smooth' })
              }
            } catch (e) {
              // fallback to basic scrollIntoView + small nudge
              try { if (typeof heading.scrollIntoView === 'function') heading.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch (_) {}
              try { window.scrollBy({ top: -160, left: 0, behavior: 'smooth' }) } catch (_) {}
            }
            try {
              // temporary tabindex to make it focusable for screenreaders / keyboard
              heading.setAttribute('tabindex', '-1')
              heading.focus()
              heading.removeAttribute('tabindex')
            } catch (e) {
              // ignore focus errors
            }
          } else {
            // fallback: focus the first focusable input/select/textarea/button
            const focusable = box.querySelector('input, select, textarea, button, [tabindex]:not([tabindex="-1"])')
            if (focusable && typeof focusable.focus === 'function') {
              focusable.focus()
              if (typeof focusable.scrollIntoView === 'function') focusable.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else {
              // fallback to window scroll
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
            }
          }
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
        }
      } catch (e) {
        // ignore scrolling errors
      }
    }, 50)
    return () => clearTimeout(t)
  }, [enterKey])

  const [all, setAll] = useState({ section1: null, section2: null, section3: null, section4: null, section5: null, section6: null, section7: null })
  const [section5Mode, setSection5Mode] = useState(null) // 'borderline' | 'critical' | null
  const [section6Mode, setSection6Mode] = useState(null) // 'borderline' | 'critical' | null
  const [results, setResults] = useState(null)
  const navigate = useNavigate()

  const handleSection1Next = (data) => {
    const next = { ...all, section1: data }
    setAll(next)
    // non salviamo più le risposte intermedie in localStorage
    goToStep(2)
  }

  const handleSection2Finish = (data) => {
    const next = { ...all, section2: data }
    setAll(next)
    // no localStorage per risposte intermedie

    // compute mean score for section2 based on normalized responses
    const normalized = (data && data.responsesNormalized) || {}
    const nums = Object.values(normalized).map(v => Number(v)).filter(n => !Number.isNaN(n) && n >= 1 && n <= 5)
    if (nums.length > 0) {
      const mean = nums.reduce((a,b) => a + b, 0) / nums.length
      let score = Math.round(25 * (mean - 1))
      if (score < 0) score = 0
      if (score > 100) score = 100
      // if severe negative (<40) open Section 2.2 Clinical
      if (score < 40) {
        goToStep(2.2)
        return
      }
      // if borderline (40-59) open Section 2.1 Borderline
      if (score >= 40 && score <= 59) {
        goToStep(2.1)
        return
      }
    }

    // otherwise advance to section 3
    goToStep(3)
  }

  const handleSection2BorderlineFinish = (data) => {
    const next = { ...all, section2Borderline: data }
    setAll(next)
    goToStep(3)
  }

  const handleSection2ClinicalFinish = (data) => {
    const next = { ...all, section2Clinical: data }
    setAll(next)
    goToStep(3)
  }

  const handleSection3Finish = (data) => {
    const next = { ...all, section3: data }
    setAll(next)
    // determine whether to show activity/sleep modules based on scores
    const activityScore = data && (data.activityScore ?? data.scoreAct ?? null)
    const sleepScore = data && (data.sleepScore ?? data.scoreSleep ?? null)
    const needActivity = typeof activityScore === 'number' && activityScore < 40
    const needSleep = typeof sleepScore === 'number' && sleepScore < 40
    if (needActivity || needSleep) {
      // store flags in state (we'll read from `all` in render)
      setAll(prev => ({ ...prev, _3_1_flags: { needActivity, needSleep } }))
      goToStep(3.1)
      return
    }
    // otherwise advance to section 4
    goToStep(4)
  }

  const handleSection3ModuleFinish = (payload) => {
    // attach module payload to section3 data and save
    const next = { ...all, section3: { ...(all.section3 || {}), activityModule: payload.activityModule, sleepModule: payload.sleepModule } }
    setAll(next)
    // proceed to section 4
    goToStep(4)
  }

  const handleSection4Finish = (data) => {
    const next = { ...all, section4: data }
    setAll(next)
    goToStep(5)
  }

  // Updated: handleSection5Finish to route to 5.1 when needed
  const handleSection5Finish = (data) => {
    const next = { ...all, section5: data }
    setAll(next)

    // Prefer using the numeric sectionScore if available (more deterministic)
    const sectionScore = data && (typeof data.sectionScore === 'number' ? data.sectionScore : (data && data.sectionScore ? Number(data.sectionScore) : null))
    let isCritical = false
    let isBorderline = false
    if (typeof sectionScore === 'number' && !Number.isNaN(sectionScore)) {
      isCritical = sectionScore < 40
      isBorderline = sectionScore >= 40 && sectionScore <= 59
    } else {
      // fallback to flags if numeric score missing
      isCritical = data && data.activateCritical
      isBorderline = data && data.activateBorderline
    }

    // set explicit mode to avoid relying on asynchronous setAll; ensures correct component is shown immediately
    if (isCritical) setSection5Mode('critical')
    else if (isBorderline) setSection5Mode('borderline')
    else setSection5Mode(null)

    console.log('[DEBUG][Questionnaire] Section5 finish received', { data, sectionScore, isBorderline, isCritical })

    if (isCritical || isBorderline) {
      goToStep(5.1)
      console.log('[DEBUG][Questionnaire] navigating to step 5.1 with mode', isCritical ? 'critical' : 'borderline')
      return
    }

    // otherwise advance to section 6
    goToStep(6)
  }

  // new handlers for 5.1 outcomes
  const handleSection5BorderlineFinish = (payload) => {
    const next = { ...all, section5Borderline: payload }
    setAll(next)
    // 5.1 not considered in final score, proceed to section 6
    setSection5Mode(null)
    goToStep(6)
  }

  const handleSection5CriticalFinish = (payload) => {
    const next = { ...all, section5Critical: payload }
    setAll(next)
    // 5.1 not considered in final score, proceed to section 6
    setSection5Mode(null)
    goToStep(6)
  }

  const handleSection6Finish = (data) => {
    const next = { ...all, section6: data }
    setAll(next)

    // Prefer numeric sectionScore when available
    const sectionScore = data && (typeof data.sectionScore === 'number' ? data.sectionScore : (data && data.sectionScore ? Number(data.sectionScore) : null))
    let isCritical = false
    let isBorderline = false
    if (typeof sectionScore === 'number' && !Number.isNaN(sectionScore)) {
      isCritical = sectionScore < 40
      isBorderline = sectionScore >= 40 && sectionScore <= 59
    } else {
      isCritical = data && data.activateCritical
      isBorderline = data && data.activateBorderline
    }

    if (isCritical) setSection6Mode('critical')
    else if (isBorderline) setSection6Mode('borderline')
    else setSection6Mode(null)

    console.log('[DEBUG][Questionnaire] Section6 finish received', { data, sectionScore, isBorderline, isCritical })

    if (isCritical || isBorderline) {
      goToStep(6.1)
      console.log('[DEBUG][Questionnaire] navigating to step 6.1 with mode', isCritical ? 'critical' : 'borderline')
      return
    }

    // otherwise proceed to section 7
    goToStep(7)
  }

  const handleSection6CriticalFinish = (payload) => {
    const next = { ...all, section6Critical: payload }
    setAll(next)
    setSection6Mode(null)
    goToStep(7)
  }

  const handleSection6BorderlineFinish = (data) => {
    const next = { ...all, section6Borderline: data }
    setAll(next)
    goToStep(7)
  }

  const handleSection7Finish = (data) => {
    const next = { ...all, section7: data }
    setAll(next)
    // Calcola riepilogo finale e salva solo quello in localStorage
     // compute scores per section (we'll consider sections 2..7)
    const sectionIds = ['section2','section3','section4','section5','section6','section7']
    const perSection = {}
    sectionIds.forEach(id => {
      const sec = next[id]
      const nums = extractNumericResponses(sec)
      if (nums.length > 0) {
        const mean = nums.reduce((a,b) => a + b, 0) / nums.length
        let score = Math.round(25 * (mean - 1))
        if (score < 0) score = 0
        if (score > 100) score = 100
        perSection[id] = { mean, score, n: nums.length }
      } else {
        perSection[id] = null
      }
    })

    // average only over sections that have a score
    const validScores = Object.values(perSection).filter(s => s && typeof s.score === 'number').map(s => s.score)
    const finalScore = validScores.length ? Math.round(validScores.reduce((a,b) => a + b, 0) / validScores.length) : null
    let category = null
    if (finalScore !== null) {
      if (finalScore >= 70) category = 'Buono / Salute 360 solida (esito positivo generale)'
      else if (finalScore >= 50) category = 'Soddisfacente / attenzionare (alcuni domini possono richiedere intervento)'
      else category = 'Critico / multidimensionale (intervento consigliato su più domini)'
    }

    const summary = {
      perSection,
      finalScore,
      category,
      section2Borderline: next.section2Borderline || null,
      section2Clinical: next.section2Clinical || null,
      section3Info: next.section3 ? {
        activityScore: next.section3.activityScore ?? next.section3.scoreAct ?? null,
        sleepScore: next.section3.sleepScore ?? next.section3.scoreSleep ?? null,
        section3Total: next.section3.section3Total ?? next.section3.section3Score ?? null,
        activityModule: next.section3.activityModule ?? null,
        sleepModule: next.section3.sleepModule ?? null,
        tag: next.section3.tag ?? null,
        sleepTag: next.section3.sleepTag ?? null,
        section3Score: next.section3.section3Score ?? next.section3.section3Total ?? null,
      } : null,
    }

    try { localStorage.setItem('questionnaire_results', JSON.stringify(summary)) } catch {}
    // pulizia chiavi legacy
    try {
      localStorage.removeItem('questionnaire_allSections')
      localStorage.removeItem('questionnaire_section2')
      localStorage.removeItem('questionnaire_section2_borderline')
      localStorage.removeItem('questionnaire_section2_clinical')
      localStorage.removeItem('questionnaire_section3')
      localStorage.removeItem('questionnaire_activityModule')
    } catch {}

    const res = { perSection, finalScore, category }
    setResults(res)
    if (typeof onFinishAll === 'function') onFinishAll(next)
    else console.log('Sezioni 1-7 completate e salvate localmente', res)

    // mark questionnaire completed in auth context
    try {
      if (typeof completeQuestionnaire === 'function') completeQuestionnaire()
    } catch (e) {
      // ignore
    }

    // Redirect to results page
    navigate('/results')
  }

  // decide render mode for 5.1 to help debugging
  const decideSection5RenderMode = () => {
    if (section5Mode === 'critical') return 'critical'
    if (section5Mode === 'borderline') return 'borderline'
    const s5 = all.section5 || {}
    if (s5.activateCritical) return 'critical'
    if (s5.activateBorderline) return 'borderline'
    return null
  }

  const _section5RenderMode = decideSection5RenderMode()
  if (_section5RenderMode) console.log('[DEBUG][Questionnaire] _section5RenderMode =', _section5RenderMode)

  // estimated question counts per section (tweakable)
  const sectionQuestionCounts = {
    section1: 5, // age,height,weight,sex + intro
    section2: 16, // many diet questions
    section3: 12, // physio
    section4: 12,
    section5: 10,
    section6: 10,
    section7: 6
  }

  // helper: count non-empty answers in a section object
  function countAnswered(sectionObj) {
    if (!sectionObj || typeof sectionObj !== 'object') return 0
    let count = 0
    const stack = [sectionObj]
    while (stack.length) {
      const cur = stack.pop()
      if (!cur || typeof cur !== 'object') continue
      Object.entries(cur).forEach(([k,v]) => {
        if (v === null || v === undefined) return
        if (typeof v === 'string' && v.trim() === '') return
        if (typeof v === 'number' && !Number.isFinite(v)) return
        if (Array.isArray(v)) {
          if (v.length > 0) count += v.length
          v.forEach(item => { if (typeof item === 'object' && item !== null) stack.push(item) })
          return
        }
        if (typeof v === 'object') { stack.push(v); return }
        // primitive non-empty
        count += 1
      })
    }
    return count
  }

  const SECTION_PAGE_SIZE = 5
  const [sectionPage, setSectionPage] = useState(0)
  const [sectionTotalItems, setSectionTotalItems] = useState(0)

  // Reset section pagination when step changes
  useEffect(() => {
    setSectionPage(0)
  }, [enterKey])

  // helper to get the currently rendered section form inside the box
  function getCurrentSectionForm() {
    try {
      const box = boxRef && boxRef.current
      if (!box) return null
      // find the first visible form for the current section
      const form = box.querySelector('.questionnaire-form')
      return form
    } catch (e) {
      return null
    }
  }

  // Recompute pagination whenever the active section changes (enterKey) or page changes
  useEffect(() => {
    // retry a few times because some section components render options asynchronously
    const timers = []
    const delays = [60, 220, 600]
    delays.forEach(d => {
      const t = setTimeout(() => paginateSection(sectionPage), d)
      timers.push(t)
    })
    return () => timers.forEach(t => clearTimeout(t))
  }, [enterKey, sectionPage])

  function paginateSection(page = 0) {
    const form = getCurrentSectionForm()
    if (!form) {
      setSectionTotalItems(0)
      return
    }
    // prefer high-level wrappers first
    const primarySelectors = ['.form-row', 'fieldset', '.question-item']
    const secondarySelectors = ['.radio-item', '.scale-option', '.checkbox-item']

    let nodes = Array.from(form.querySelectorAll(primarySelectors.join(','))).filter(Boolean)
    // if primary didn't find enough, include secondary selectors
    if (nodes.length < Math.min(SECTION_PAGE_SIZE, 3)) {
      const extra = Array.from(form.querySelectorAll(secondarySelectors.join(','))).filter(Boolean)
      nodes = nodes.concat(extra)
    }

    // Fallback: if still too few, consider direct children (forms that don't use .form-row wrappers)
    if (nodes.length < Math.min(SECTION_PAGE_SIZE, 3)) {
      const children = Array.from(form.children || [])
      nodes = children.filter(ch => {
        try {
          if (!(ch && ch.nodeType === 1)) return false
          if (ch.classList && (ch.classList.contains('form-actions') || ch.classList.contains('results-summary') || ch.classList.contains('section-pager'))) return false
          if (ch.matches && (ch.matches('.form-row') || ch.matches('fieldset') || ch.matches('.question-item'))) return true
          if (ch.querySelector && ch.querySelector('input, select, textarea, .scale-option, .radio-item, .checkbox-item')) return true
        } catch (e) { return false }
        return false
      })
    }

    // compute visibility for nodes: prefer those with client rects (visible / rendered)
    const visibleNodes = nodes.filter(n => {
      try {
        const rects = n.getClientRects()
        return rects && rects.length > 0
      } catch (e) { return true }
    })
    const total = visibleNodes.length || nodes.length
    setSectionTotalItems(total)

    // Debugging info
    // eslint-disable-next-line no-console
    console.debug('[Questionnaire] paginateSection', { sectionPage: page, nodesFound: nodes.length, visibleNodes: visibleNodes.length, primarySelectors, secondarySelectors })

    // show only nodes in the current slice using Array.slice
    const start = page * SECTION_PAGE_SIZE
    const end = (page + 1) * SECTION_PAGE_SIZE
    const source = visibleNodes.length > 0 ? visibleNodes : nodes
    const visible = source.slice(start, end)
    // hide all source nodes
    source.forEach(n => { n.classList.add('hidden-question'); n.setAttribute('aria-hidden', 'true') })
    // show only the sliced nodes
    visible.forEach(n => { n.classList.remove('hidden-question'); n.removeAttribute('aria-hidden') })
  }

  // handler for pagination "next" button
  const handlePagerNext = () => {
    setSectionPage(p => Math.min(p + 1, Math.ceil(sectionTotalItems / SECTION_PAGE_SIZE) - 1))
  }

  // handler for pagination "prev" button
  const handlePagerPrev = () => {
    setSectionPage(p => Math.max(p - 1, 0))
  }

  return (
    <div className="questionnaire-root">
      <div className="questionnaire-box" ref={boxRef}>
        {/* show per-section progress to make questionnaire feel shorter */}
        {(() => {
          const sectionKey = `section${Math.floor(step)}`
          if (sectionKey && Object.prototype.hasOwnProperty.call(sectionQuestionCounts, sectionKey)) {
            const answered = countAnswered(all[sectionKey])
            const totalQ = sectionQuestionCounts[sectionKey]
            const label = `Sezione ${Math.floor(step)}`
            return <ProgressBar sectionLabel={label} current={Math.min(answered, totalQ)} sectionTotal={totalQ} />
          }
          return <ProgressBar step={step} total={totalSteps} />
        })()}

        {/* per-section pagination controls: shown when section has more items than page size */}
        {sectionTotalItems > SECTION_PAGE_SIZE && (
          <div className="section-pager" style={{ marginTop: 10 }}>
            <div className="pager-info">Domande {Math.min(sectionPage*SECTION_PAGE_SIZE+1, sectionTotalItems)}-{Math.min((sectionPage+1)*SECTION_PAGE_SIZE, sectionTotalItems)} di {sectionTotalItems}</div>

          </div>
        )}
   {/* qui ricordati che  cera un pulsante riga 541 */}

        {step === 1 && (
          <>
            <h1 className="questionnaire-title">{language === 'en' ? 'Questionnaire Lumina' : title}</h1>
            <p className="questionnaire-intro">{language === 'en' ? introTextEn : introduction}</p>
            {language === 'en' ? (
              <pre style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.8)' }}>{instructionsEn}</pre>
            ) : null}
          </>
        )}

        {step === 1 && <Section1 key={`1-${enterKey}`} onNext={handleSection1Next} />}
        {step === 2 && <Section2 key={`s2-${enterKey}`} initial={all.section2 || {}} allergyVariant="underline" onChange={(d) => setAll(prev => ({ ...prev, section2: d }))} onPrev={() => goToStep(1)} onFinish={handleSection2Finish} />}
        {step === 2.1 && <Section2Borderline key={`2.1-${enterKey}`} initial={all.section2Borderline || {}} onPrev={() => goToStep(2)} onFinish={handleSection2BorderlineFinish} onChange={(data) => setAll(a => ({ ...a, section2Borderline: data }))} />}
        {step === 2.2 && <Section2Clinical key={`2.2-${enterKey}`} initial={all.section2Clinical || {}} onPrev={() => goToStep(2)} onFinish={handleSection2ClinicalFinish} onChange={(data) => setAll(a => ({ ...a, section2Clinical: data }))} />}
        {step === 3 && <Section3 key={`3-${enterKey}`} initial={all.section3 || {}} onPrev={() => goToStep(2)} onFinish={handleSection3Finish} onChange={(data) => setAll(a => ({ ...a, section3: data }))} />}
        {step === 3.1 && (
          <Section3ModulePage key={`3.1-${enterKey}`}
            initial={{ activityModule: all.section3 && all.section3.activityModule ? all.section3.activityModule : null, sleepModule: all.section3 && all.section3.sleepModule ? all.section3.sleepModule : null }}
            showActivity={all._3_1_flags ? all._3_1_flags.needActivity : false}
            showSleep={all._3_1_flags ? all._3_1_flags.needSleep : false}
            onPrev={() => goToStep(3)}
            onFinish={handleSection3ModuleFinish}
          />
        )}
        {step === 4 && <Section4 key={`4-${enterKey}`} initial={all.section4 || {}} onPrev={() => goToStep(3)} onFinish={handleSection4Finish} onChange={(data) => setAll(a => ({ ...a, section4: data }))} />}
        {step === 5 && <Section5 key={`5-${enterKey}`} initial={all.section5 || {}} onPrev={() => goToStep(4)} onFinish={handleSection5Finish} onChange={(data) => setAll(a => ({ ...a, section5: data }))} />}
        {step === 5.1 && (
           // prefer explicit mode set during submit; fallback to saved all.section5 flags
           (() => {
            if (section5Mode === 'critical') return <Section5Critical key={`5c-${enterKey}`} initial={all.section5Critical || {}} onPrev={() => { setSection5Mode(null); goToStep(5) }} onFinish={handleSection5CriticalFinish} />
            if (section5Mode === 'borderline') return <Section5Borderline key={`5b-${enterKey}`} initial={all.section5Borderline || {}} onPrev={() => { setSection5Mode(null); goToStep(5) }} onFinish={handleSection5BorderlineFinish} />
            const s5 = all.section5 || {}
            if (s5.activateCritical) return <Section5Critical key={`5c-${enterKey}`} initial={all.section5Critical || {}} onPrev={() => goToStep(5)} onFinish={handleSection5CriticalFinish} />
            return <Section5Borderline key={`5b-${enterKey}`} initial={all.section5Borderline || {}} onPrev={() => goToStep(5)} onFinish={handleSection5BorderlineFinish} />
           })()
         )}
        {step === 6 && <Section6 key={`6-${enterKey}`} initial={all.section6 || {}} onPrev={() => goToStep(5)} onFinish={handleSection6Finish} onChange={(data) => setAll(a => ({ ...a, section6: data }))} />}
        {step === 6.1 && (
           (() => {
            if (section6Mode === 'critical') return <Section6Critical key={`6c-${enterKey}`} initial={all.section6Critical || {}} onPrev={() => { setSection6Mode(null); goToStep(6) }} onFinish={handleSection6CriticalFinish} />
            if (section6Mode === 'borderline') return <Section6Borderline key={`6b-${enterKey}`} initial={all.section6Borderline || {}} onPrev={() => { setSection6Mode(null); goToStep(6) }} onFinish={handleSection6BorderlineFinish} />
            const s6 = all.section6 || {}
            if (s6.activateCritical) return <Section6Critical key={`6c-${enterKey}`} initial={all.section6Critical || {}} onPrev={() => goToStep(6)} onFinish={handleSection6CriticalFinish} />
            return <Section6Borderline key={`6b-${enterKey}`} initial={all.section6Borderline || {}} onPrev={() => goToStep(6)} onFinish={handleSection6BorderlineFinish} />
           })()
         )}
        {step === 7 && <Section7 key={`7-${enterKey}`} initial={all.section7 || {}} onPrev={() => goToStep(6)} onFinish={handleSection7Finish} onChange={(data) => setAll(a => ({ ...a, section7: data }))} />}

        {/* show results summary when available */}
        {results && (
          <div className="results-summary" style={{ marginTop: 18, padding: 16, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <h3>Risultato finale</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(results.perSection).map(([k,v]) => (
                <div key={k}>
                  <strong>{k.replace('section','Sezione ')}:</strong> {v ? `${v.score} (media ${v.mean.toFixed(2)}, n=${v.n})` : 'N/D (nessuna domanda misurabile)'}
                </div>
              ))}
              <hr />
              <div><strong>Punteggio complessivo:</strong> {results.finalScore !== null ? `${results.finalScore} / 100` : 'N/D'}</div>
              <div><strong>Valutazione:</strong> {results.category || 'N/D'}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// Helper: estrarre ricorsivamente risposte numeriche 1..5 da un oggetto sezione
function extractNumericResponses(obj) {
  const nums = []
  if (!obj || typeof obj !== 'object') return nums
  const stack = [obj]
  while (stack.length) {
    const cur = stack.pop()
    if (!cur || typeof cur !== 'object') continue
    // common patterns
    if (cur.responsesNormalized && typeof cur.responsesNormalized === 'object') {
      Object.values(cur.responsesNormalized).forEach(v => { const n = Number(v); if (!Number.isNaN(n) && n >= 1 && n <= 5) nums.push(n) })
      continue
    }
    if (cur.actNorm && typeof cur.actNorm === 'object') {
      Object.values(cur.actNorm).forEach(v => { const n = Number(v); if (!Number.isNaN(n) && n >= 1 && n <= 5) nums.push(n) })
    }
    if (cur.actOrig && typeof cur.actOrig === 'object') {
      Object.values(cur.actOrig).forEach(v => { const n = Number(v); if (!Number.isNaN(n) && n >= 1 && n <= 5) nums.push(n) })
    }
    if (cur.healthNorm && typeof cur.healthNorm === 'object') {
      Object.values(cur.healthNorm).forEach(v => { const n = Number(v); if (!Number.isNaN(n) && n >= 1 && n <= 5) nums.push(n) })
    }
    if (cur.chronicNorm && typeof cur.chronicNorm === 'object') {
      Object.values(cur.chronicNorm).forEach(v => { const n = Number(v); if (!Number.isNaN(n) && n >= 1 && n <= 5) nums.push(n) })
    }
    if (cur.supportNorm && typeof cur.supportNorm === 'object') {
      Object.values(cur.supportNorm).forEach(v => { const n = Number(v); if (!Number.isNaN(n) && n >= 1 && n <= 5) nums.push(n) })
    }
    if (cur.participationNorm && typeof cur.participationNorm === 'object') {
      Object.values(cur.participationNorm).forEach(v => { const n = Number(v); if (!Number.isNaN(n) && n >= 1 && n <= 5) nums.push(n) })
    }

    // generic scan: look for numeric values directly or nested objects
    Object.entries(cur).forEach(([k,v]) => {
      if (k === 'responses' || k === 'responsesOriginal' || k === 'responsesNormalized' || k === 'activities' || k === 'sleep' || k === 'wellbeing' || k === 'health' || k === 'chronic' || k === 'support' || k === 'participation' || k === 'lifeSatisfaction' || k === 'quality' || k === 'micro' || k === 'microLimitations' || k === 'microSleep') {
        if (v && typeof v === 'object') stack.push(v)
        return
      }
      if (typeof v === 'number') {
        if (v >= 1 && v <= 5) nums.push(v)
      } else if (typeof v === 'string') {
        const n = Number(v)
        if (!Number.isNaN(n) && n >= 1 && n <= 5) nums.push(n)
      } else if (Array.isArray(v)) {
        v.forEach(item => { if (typeof item === 'number' && item >=1 && item <=5) nums.push(item); else if (typeof item === 'string') { const n = Number(item); if (!Number.isNaN(n) && n>=1&& n<=5) nums.push(n) } else if (typeof item === 'object') stack.push(item) })
      } else if (typeof v === 'object' && v !== null) {
        stack.push(v)
      }
    })
  }
  return nums
}
