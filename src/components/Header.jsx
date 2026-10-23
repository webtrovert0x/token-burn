import { useAppKit } from '@reown/appkit/react'
import { useAccount, useChainId } from 'wagmi'
import { TOKEN_BURNER_ADDRESS } from '../config/contractAddress'

export default function Header() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const shorten = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const isMainnet = chainId === 677

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-logo">
            <span className="flame-icon">🔥</span>
          </div>
          <div>
            <div className="header-title">Token Burner</div>
            <div className="header-subtitle">BotChain Protocol</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Network Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-primary)',
            borderRadius: '20px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e',
              display: 'inline-block',
            }} />
            <span>BotChain Mainnet</span>
          </div>

          {TOKEN_BURNER_ADDRESS && (
            <a
              href={`https://scan.botchain.ai/address/${TOKEN_BURNER_ADDRESS}#code`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                padding: '6px 10px',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                transition: 'var(--transition)',
              }}
              title="View Deployed TokenBurner Contract"
            >
              📜 Contract ↗
            </a>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => open()}
            style={{ fontWeight: 600 }}
          >
            {isConnected ? `🟢 ${shorten(address)}` : '🔗 Connect Wallet'}
          </button>
        </div>
      </div>
    </header>
  )
}
