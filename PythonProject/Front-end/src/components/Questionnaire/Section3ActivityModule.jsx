import React, { useState, forwardRef, useImperativeHandle } from 'react'

const ActivityModule = forwardRef(function ActivityModule({ initial = {}, onPrev = () => {}, onFinish = () => {}, showActions = true }, ref) {
    const qs = [
        { id: 'am1', text: 'Sento di non avere tempo libero a causa del lavoro, dello studio o della famiglia.' },
        { id: 'am2', text: 'Arrivo a fine giornata troppo stanco/a o privo/a di energie per allenarmi.' },
        { id: 'am3', text: "Trovo l'esercizio fisico noioso o poco stimolante." },
        { id: 'am4', text: 'Non ho luoghi adatti, strutture o attrezzature accessibili vicino a me.' },
        { id: 'am5', text: 'Mi sento a disagio, insicuro/a o temo di farmi male facendo sport.' },
    ]

    const [state, setState] = useState(() => ({ ...initial }))
    const [errors, setErrors] = useState(null)

    const handleChange = (id, val) => setState(s => ({ ...s, [id]: val }))

    const validate = () => {
        const missing = qs.filter(q => !state[q.id])
        if (missing.length) {
            setErrors('Rispondi a tutte le domande del modulo attività fisica')
            return false
        }
        setErrors(null)
        return true
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!validate()) return
        // save raw answers (yes/no)
        const payload = { module: 'activityExtra', responses: { ...state } }
        try { localStorage.setItem('questionnaire_activityModule', JSON.stringify(payload)) } catch (e) { console.warn('Could not save activity module', e) }
        onFinish(payload)
    }

    // expose imperative method for parent to call when showActions is false
    useImperativeHandle(ref, () => ({
        validateAndGetPayload: () => {
            if (!validate()) {
                // return null to indicate invalid
                return null
            }
            const payload = { module: 'activityExtra', responses: { ...state } }
            try { localStorage.setItem('questionnaire_activityModule', JSON.stringify(payload)) } catch (e) { console.warn('Could not save activity module (parent submit)', e) }
            return payload
        }
    }))

    return (
        <form className="micro-survey" onSubmit={handleSubmit}>
            <h5>Modulo attività fisica</h5>
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
                    <button type="button" className="btn-secondary" onClick={onPrev}>Torna indietro</button>
                    <button type="submit" className="btn-primary">Continua</button>
                </div>
            )}
        </form>
    )
})

export default ActivityModule
