import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Startup check for required environment variables
if (!import.meta.env.VITE_SITE_URL) {
  console.error('⚠️ VITE_SITE_URL is missing. Authentication may not work properly.');
  console.error('Please set VITE_SITE_URL in your environment variables.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
