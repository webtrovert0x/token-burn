import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { botTestnet } from './chain'

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || ''

const metadata = {
  name: 'BOT Token Burner',
  description: 'Permanently reduce circulating supply of ERC-20 tokens on BotChain Protocol',
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

const networks = [botTestnet]

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#dc2626',
    '--w3m-color-mix': '#1a1a1a',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '2px',
  },
})

export const config = wagmiAdapter.wagmiConfig
