import { useAppKit } from '@reown/appkit/react'

export default function ConnectPrompt() {
  const { open } = useAppKit()

  return (
    <div className="connect-prompt animate-in">
      <div className="connect-prompt-icon">🔥</div>
      <h2>Connect Your Wallet</h2>
      <p>
        Connect your wallet to start burning ERC-20 tokens on BotChain Protocol.
        All burns are permanent and irreversible.
      </p>
      <button className="btn btn-primary" style={{ maxWidth: 280 }} onClick={() => open()}>
        Connect Wallet
      </button>
    </div>
  )
}
