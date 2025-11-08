import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppKitProvider } from './modules/auth'
import App from './App'
import './index.css' 

// 👇 PROSTY LOG DLA DEVELOPMENT - BEZ DEBUG LOGGER
if (import.meta.env.DEV) {
  console.log('🔧 HUB VOTE - Development Mode Active');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppKitProvider>
      <App />
    </AppKitProvider>
  </React.StrictMode>,
)