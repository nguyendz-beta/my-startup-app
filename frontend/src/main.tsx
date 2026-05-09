import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: { fontSize: '14px' },
        success: { style: { background: '#f0fdf4', color: '#166534' } },
        error: { style: { background: '#fef2f2', color: '#991b1b' } },
      }}
    />
    <App />
  </React.StrictMode>
)