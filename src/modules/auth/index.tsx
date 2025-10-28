import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider, useAccount, useDisconnect } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, base } from '@reown/appkit/networks'
import React from 'react'

const queryClient = new QueryClient()

const projectId = import.meta.env.VITE_APPKIT_PROJECT_ID || '3e0b3fbd7441c05e8e0341db43652167'

const metadata = {
  name: 'HUB Vote',
  description: 'Decentralized Voting Platform',
  url: import.meta.env.VITE_APP_URL || 'https://hube-vote.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

const wagmiAdapter = new WagmiAdapter({
  networks: [celo, base] as [typeof celo, ...typeof base[]],
  projectId,
  ssr: false
})

createAppKit({
  adapters: [wagmiAdapter],
  networks: [celo, base] as [typeof celo, ...typeof base[]],
  projectId,
  metadata,
  features: {
    analytics: true
  }
})

import { useAppKit as useAppKitOriginal } from '@reown/appkit/react'

export function useAppKit() {
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const { open, close } = useAppKitOriginal()
  
  return { isConnected, address, open, close, disconnect }
}

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
console.log('🔧 Networks:', [celo, base])
