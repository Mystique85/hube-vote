import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppKitProvider } from './modules/auth'
import App from './App'
import './index.css' 

// IMPORT DEBUG SYSTEM - zawsze aktywny w development
import { debugLogger } from './utils/debugLogger'

// Automatyczne logowanie informacji o starcie aplikacji
if (import.meta.env.DEV) {
  debugLogger.enableDebug();
  console.log('%c🔧 HUB VOTE DEBUG MODE AKTYWNY', 'color: #2ecc71; font-weight: bold; font-size: 16px;');
  
  // Globalna funkcja debug dla konsoli F12
  (window as any).hubDebug = debugLogger;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppKitProvider>
      <App />
    </AppKitProvider>
  </React.StrictMode>,
)