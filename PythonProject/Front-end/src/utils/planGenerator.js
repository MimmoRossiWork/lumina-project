// Utility to generate a 7-day mental health focused plan based on simple quiz inputs
export function generatePlan({ stress = 5, anxiety = 5, coping = 5 } = {}) {
  const TEMPLATE = [
    '3 minuti di respirazione profonda (4-4-4)',
    'Esercizio di grounding: 5 cose che vedi, 4 che tocchi',
    'Breve passeggiata consapevole (5-10 min)',
    'Scrivi 1 pensiero positivo o piccolo successo',
    'Riduci dispositivi 30 min prima del sonno',
    'Pratica 2 minuti di rilassamento muscolare progressivo',
    'Contatta un amico o una persona di fiducia per un breve check-in',
  ]

  const s = Number(stress || 0)
  const a = Number(anxiety || 0)
  const c = Number(coping || 0)

  const items = []
  for (let i = 0; i < 7; i++) {
    if (s >= 8 || a >= 8) {
      if (i % 2 === 0) items.push('3 minuti di respirazione guidata (4-4-4)')
      else if (i % 3 === 0) items.push('Esercizio di grounding: 5 cose che vedi, 4 che tocchi')
      else items.push('Breve passeggiata mindfulness (5-10 min)')
    } else if (c <= 4) {
      if (i % 2 === 0) items.push('Scrivi 1 piccolo successo o gratitudine (2 min)')
      else items.push('Pratica rilassamento muscolare progressivo (3 min)')
    } else {
      items.push(TEMPLATE[i % TEMPLATE.length])
    }
  }

  if (a >= 9) items[0] = 'Se ti senti sopraffatto: parla con una persona di fiducia o cerca supporto professionale'

  return items
}

export default generatePlan

