import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ToasterProvider } from './components/Toaster'
import { applyTheme, getTheme } from './lib/storage'
import './index.css'

applyTheme(getTheme())
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getTheme() === 'system') applyTheme('system')
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToasterProvider>
        <App />
      </ToasterProvider>
    </BrowserRouter>
  </React.StrictMode>
)
