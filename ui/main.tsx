;(window as any).__designlint_boot = true
import './styles.scss'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const rootEl = document.getElementById('root')
if (!rootEl) {
  // eslint-disable-next-line no-console
  console.error('[UI] #root not found')
} else {
  createRoot(rootEl).render(<App />)
}
