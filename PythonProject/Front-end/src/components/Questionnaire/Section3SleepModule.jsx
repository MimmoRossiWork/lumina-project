import React, { useState, forwardRef, useImperativeHandle } from 'react'

const SleepModule = forwardRef(function SleepModule({ initial = {}, onPrev = () => {}, onFinish = () => {}, showActions = true }, ref) {
    const qs = [
        { id: 'sm1', text: 'Impiego più di 30 minuti per addormentarmi una volta andato a letto.' },
        { id: 'sm2', text: 'Mi sveglio nel cuore della notte o troppo presto al mattino e non riesco a riaddormentarmi.' },
        { id: 'sm3', text: 'Ho difficoltà a rimanere sveglio/a o attivo/a durante le attività quotidiane (guidare, mangiare, socializzare).' },
        { id: 'sm4', text: 'Ho fatto uso di farmaci (prescritti o da banco) per aiutarmi a dormire.' },
        { id: 'sm5', text: 'Valutando complessivamente, definirei la qualità del mio sonno "Pessima".' },
    ]

    const [state, setState] = useState(() => ({ ...initial }))
    const [errors, setErrors] = useState(null)

    const handleChange = (id, val) => setState(s => ({ ...s, [id]: val }))

    const validate = () => {
        const missing = qs.filter(q => !state[q.id])
        if (missing.length) {
            setErrors('Rispondi a tutte le domande del modulo criticità del sonno')
            return false
        }
        setErrors(null)
        return true
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!validate()) return
        const payload = { module: 'sleepExtra', responses: { ...state } }
        try { localStorage.setItem('questionnaire_sleepModule', JSON.stringify(payload)) } catch (e) { console.warn('Could not save sleep module', e) }
        onFinish(payload)
    }

    useImperativeHandle(ref, () => ({
        validateAndGetPayload: () => {
            if (!validate()) return null
            const payload = { module: 'sleepExtra', responses: { ...state } }
            try { localStorage.setItem('questionnaire_sleepModule', JSON.stringify(payload)) } catch (e) { console.warn('Could not save sleep module (parent submit)', e) }
            return payload
        }
    }))

    return (
        <form className="micro-survey" onSubmit={handleSubmit}>
            <h5>Modulo criticità del sonno</h5>
            <p className="small-muted">Rispondi Sì / No</p>
            {qs.map(q => (
                <label key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <span style={{ flex: 1 }}>{q.text}</span>
                    <select value={state[q.id] || ''} onChange={e => handleChange(q.id, e.target.value)}>
                        <option value="">Seleziona</option>
                        <option value="yes">Sì</option>
                        <option value="no">No</option>
                    </select>
                </label>
            ))}
            {errors && <div className="error">{errors}</div>}

            {showActions && (
                <div className="form-actions" style={{ marginTop: 10 }}>
                    <button type="button" className="btn-secondary" onClick={onPrev}>Torna Indietro</button>
                    <button type="submit" className="btn-primary">Continua</button>
                </div>
            )}
        </form>
    )
})

export default SleepModule
