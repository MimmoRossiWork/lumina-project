import React from 'react'
import styles from './AllergyInput.module.css'

export default function AllergyInput({ id, name, value, onChange, placeholder = '', variant = 'soft', ...rest }) {
  const cls = `${styles.input} ${variant === 'underline' ? styles.underline : styles.soft}`
  return (
    <input
      id={id}
      name={name}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cls}
      aria-label={placeholder || name}
      {...rest}
    />
  )
}

