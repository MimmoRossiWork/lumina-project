import React, { useState, useContext } from 'react'
import './Section1.css'
import { LanguageContext } from '../../LanguageContext'

export default function Section1({ initial = {}, onChange = () => {}, onNext = () => {} }) {
  const { language } = useContext(LanguageContext)

  const texts = {
    it: {
      ageLabel: 'Età (anni)',
      heightLabel: 'Altezza (cm)',
      weightLabel: 'Peso (kg)',
      sexLegend: 'Sesso',
      sexMale: 'Maschio',
      sexFemale: 'Femmina',
      sexOther: 'Altro / Preferisco non rispondere',
      startBtn: 'Inizia il sondaggio!',
      errors: {
        ageRequired: 'Età richiesta',
        ageInvalid: "Inserisci un'età valida (1-120)",
        heightRequired: 'Altezza richiesta',
        heightInvalid: "Inserisci un'altezza valida in cm (30-300)",
        weightRequired: 'Peso richiesto',
        weightInvalid: "Inserisci un'peso valido in kg (1-500)",
        sexRequired: 'Seleziona il sesso'
      }
    },
    en: {
      ageLabel: 'Age (years)',
      heightLabel: 'Height (cm)',
      weightLabel: 'Weight (kg)',
      sexLegend: 'Gender',
      sexMale: 'Male',
      sexFemale: 'Female',
      sexOther: 'Other / Prefer not to say',
      startBtn: "Start the questionnaire!",
      errors: {
        ageRequired: 'Age is required',
        ageInvalid: 'Enter a valid age (1-120)',
        heightRequired: 'Height is required',
        heightInvalid: 'Enter a valid height in cm (30-300)',
        weightRequired: 'Weight is required',
        weightInvalid: 'Enter a valid weight in kg (1-500)',
        sexRequired: 'Select a gender'
      }
    }
  }

  const t = texts[language] || texts.it

  const [form, setForm] = useState({ age: initial.age || '', height: initial.height || '', weight: initial.weight || '', sex: initial.sex || '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    const age = form.age === '' ? '' : Number(form.age)
    const height = form.height === '' ? '' : Number(form.height)
    const weight = form.weight === '' ? '' : Number(form.weight)

    if (form.age === '') e.age = t.errors.ageRequired
    else if (Number.isNaN(age) || age <= 0 || age > 120) e.age = t.errors.ageInvalid

    if (form.height === '') e.height = t.errors.heightRequired
    else if (Number.isNaN(height) || height < 30 || height > 300) e.height = t.errors.heightInvalid

    if (form.weight === '') e.weight = t.errors.weightRequired
    else if (Number.isNaN(weight) || weight < 1 || weight > 500) e.weight = t.errors.weightInvalid

    if (!form.sex) e.sex = t.errors.sexRequired

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
    onChange({ ...form, [name]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      try { localStorage.setItem('questionnaire_section1', JSON.stringify(form)) } catch {}
      onNext(form)
    }
  }

  return (
    <form className="questionnaire-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <label htmlFor="age">{t.ageLabel}</label>
        <input id="age" name="age" type="number" min="1" max="120" value={form.age} onChange={handleChange} required />
        {errors.age && <div className="error">{errors.age}</div>}
      </div>

      <div className="form-row">
        <label htmlFor="height">{t.heightLabel}</label>
        <input id="height" name="height" type="number" min="30" max="300" value={form.height} onChange={handleChange} required />
        {errors.height && <div className="error">{errors.height}</div>}
      </div>

      <div className="form-row">
        <label htmlFor="weight">{t.weightLabel}</label>
        <input id="weight" name="weight" type="number" min="1" max="500" value={form.weight} onChange={handleChange} required />
        {errors.weight && <div className="error">{errors.weight}</div>}
      </div>

      <fieldset className="form-row radio-row">
        <legend>{t.sexLegend}</legend>
        <div className="radio-item">
          <input id="sex_male" className="radio-input" type="radio" name="sex" value="male" checked={form.sex === 'male'} onChange={handleChange} />
          <label htmlFor="sex_male" className="radio-label-wrapper">
            <span className="radio-custom" aria-hidden="true"></span>
            <span className="radio-label">{t.sexMale}</span>
          </label>
        </div>

        <div className="radio-item">
          <input id="sex_female" className="radio-input" type="radio" name="sex" value="female" checked={form.sex === 'female'} onChange={handleChange} />
          <label htmlFor="sex_female" className="radio-label-wrapper">
            <span className="radio-custom" aria-hidden="true"></span>
            <span className="radio-label">{t.sexFemale}</span>
          </label>
        </div>

        <div className="radio-item">
          <input id="sex_other" className="radio-input" type="radio" name="sex" value="other" checked={form.sex === 'other'} onChange={handleChange} />
          <label htmlFor="sex_other" className="radio-label-wrapper">
            <span className="radio-custom" aria-hidden="true"></span>
            <span className="radio-label">{t.sexOther}</span>
          </label>
        </div>

        {errors.sex && <div className="error">{errors.sex}</div>}
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn-primary">{t.startBtn}</button>
      </div>
    </form>
  )
}
