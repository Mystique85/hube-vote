import { createAppKit, useAppKit as useAppKitOriginal } from '@reown/appkit/react'
import { WagmiProvider, useAccount, useDisconnect } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, base } from '@reown/appkit/networks'
import React from 'react'

const queryClient = new QueryClient()
const projectId = import.meta.env.VITE_APPKIT_PROJECT_ID

const metadata = {
  name: 'HUB Vote',
  description: 'Decentralized Voting Platform',
  url: import.meta.env.VITE_APP_URL || window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Initialize only if projectId exists
let wagmiAdapter;
if (projectId) {
  try {
    wagmiAdapter = new WagmiAdapter({
      networks: [celo, base],
      projectId,
    });

    createAppKit({
      adapters: [wagmiAdapter],
      networks: [celo, base],
      projectId,
      metadata,
      features: { analytics: true }
    });
    
    console.log('✅ AppKit initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize AppKit:', error);
  }
} else {
  console.warn('⚠️ VITE_APPKIT_PROJECT_ID not set - wallet features disabled');
}

export function useAppKit() {
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const { open, close } = useAppKitOriginal()
  
  return { 
    isConnected: isConnected || false, 
    address: address || null, 
    open, 
    close, 
    disconnect 
  }
}

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  if (!wagmiAdapter) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}