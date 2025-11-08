;(window as any).__designlint_boot = true
console.log('[UI] boot')
import './styles.scss'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

console.log('[UI] boot')
const rootEl = document.getElementById('root')
if (!rootEl) {
  console.error('[UI] #root not found')
} else {
  rootEl.textContent = 'JS started' // мгновенно увидишь, что скрипт исполнился
  createRoot(rootEl).render(<App />)
}

