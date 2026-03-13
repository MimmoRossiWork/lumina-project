import React from 'react'

export default function FAB({ onClick }) {
  return (
    <button className="fab" onClick={onClick} aria-label="Assistente IA">
      💬
    </button>
  )
}

