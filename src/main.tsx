import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppKitProvider } from './modules/auth'
import App from './App'
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppKitProvider>
      <App />
    </AppKitProvider>
  </React.StrictMode>,
)