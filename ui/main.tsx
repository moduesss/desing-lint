import './tailwind.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

console.log('[UI] boot');       
document.getElementById('root')!.textContent = 'JS started'; 


const el = document.getElementById('root')
if (!el) {
  console.error('[UI] #root not found')
} else {
  createRoot(el).render(<App />)
}
