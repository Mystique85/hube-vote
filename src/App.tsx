import { useAppKit } from './modules/auth'
import { UserProfileComponent } from './modules/user/components/UserProfile'
import { LoginModal } from './modules/auth/components/LoginModal'
import { useState, useEffect } from 'react'

// Debug function to check Tailwind
const checkTailwind = () => {
  console.log('🎨 TAILWIND DEBUG:')
  console.log('1. Checking if Tailwind classes are applied...')
  
  // Test if Tailwind is working
  const testElement = document.createElement('div')
  testElement.className = 'bg-red-500 p-4 text-white rounded-lg'
  testElement.innerHTML = 'Tailwind Test - If you see this styled, Tailwind works!'
  document.body.appendChild(testElement)
  
  setTimeout(() => {
    const styles = window.getComputedStyle(testElement)
    console.log('2. Test element styles:', {
      backgroundColor: styles.backgroundColor,
      padding: styles.padding,
      color: styles.color,
      borderRadius: styles.borderRadius
    })
    
    // Check if Tailwind generated styles
    const tailwindStyles = Array.from(document.styleSheets).find(sheet => 
      sheet.href?.includes('tailwind') || 
      Array.from(sheet.cssRules).some(rule => 
        rule.cssText.includes('tailwind') || 
        rule.cssText.includes('bg-red-500')
      )
    )
    
    console.log('3. Tailwind stylesheet found:', !!tailwindStyles)
    console.log('4. All stylesheets:', Array.from(document.styleSheets).map(s => s.href || 'inline'))
    
    testElement.remove()
  }, 100)
}

function App() {
  const { isConnected, address, disconnect } = useAppKit()
  const [showLogin, setShowLogin] = useState(true)

  useEffect(() => {
    // Run Tailwind debug on component mount
    checkTailwind()
  }, [])

  // Reset showLogin gdy użytkownik się rozłączy
  useEffect(() => {
    if (!isConnected) {
      setShowLogin(true)
    }
  }, [isConnected])

  // Ekran welcome
  if (showLogin && !isConnected) {
    return <LoginModal />
  }

  // Główny ekran gdy użytkownik jest połączony
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full">
        <h1 className="text-4xl font-bold text-white text-center mb-4">HUB Vote 🗳️</h1>
        <p className="text-white/80 text-center mb-6">Decentralized Voting Platform</p>
        
        {isConnected ? (
          <div className="space-y-6">
            {/* User Profile */}
            <UserProfileComponent />
            
            {/* Actions */}
            <div className="text-center space-y-3">
              <button 
                className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors w-full shadow-lg"
                onClick={checkTailwind}
              >
                Test Tailwind (Check Console)
              </button>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors w-full shadow-lg">
                Create Poll
              </button>
              <button 
                onClick={() => disconnect()}
                className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors w-full shadow-lg"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <appkit-button />
          </div>
        )}
      </div>
    </div>
  )
}

export default App