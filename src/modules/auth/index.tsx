import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider, useAccount, useDisconnect } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, base } from '@reown/appkit/networks'
import React from 'react'

// Setup queryClient
const queryClient = new QueryClient()

// Project ID z .env
const projectId = import.meta.env.VITE_APPKIT_PROJECT_ID || '3e0b3fbd7441c05e8e0341db43652167'

// Metadata
const metadata = {
  name: 'HUB Vote',
  description: 'Decentralized Voting Platform',
  url: import.meta.env.VITE_APP_URL || 'https://hub-vote.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Networks
const networks = [celo, base]

// Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
})

// Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true
  }
})

// Custom hook with Wagmi
import { useAppKit as useAppKitOriginal } from '@reown/appkit/react'

export function useAppKit() {
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const { open, close } = useAppKitOriginal()
  
  return { isConnected, address, open, close, disconnect }
}

// Provider component
export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

console.log('🔧 AppKit Module loaded')
console.log('🔧 Project ID:', projectId)
console.log('🔧 Networks:', networks)