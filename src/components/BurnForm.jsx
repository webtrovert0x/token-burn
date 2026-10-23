import { useMemo } from 'react'

export default function BurnForm({
  tokenAddress,
  setTokenAddress,
  tokenInfo,
  burnAmount,
  setBurnAmount,
  balance,
  allowance,
  isBurnable,
  supportsNativeBurn,
  supportsBurnFrom,
  useContractHelper,
  setUseContractHelper,
  isChecking,
  isBurning,
  isApproving,
  needsApproval,
  tokenBurnerAddress,
  onApprove,
  onBurn,
}) {
  const isValidAmount = useMemo(() => {
    if (!burnAmount || !balance) return false
    try {
      const amt = parseFloat(burnAmount)
      const bal = parseFloat(balance)
      return amt > 0 && amt <= bal
    } catch {
      return false
    }
  }, [burnAmount, balance])

  const canBurn = tokenInfo && isValidAmount && !isBurning && !isApproving && !needsApproval

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">
          <span className="flame-icon">🔥</span>
        </div>
        <div style={{ flex: 1 }}>
          <div className="card-title">Burn ERC-20 Tokens</div>
          <div className="card-subtitle">
            Interacting with verified smart contract: <code>{tokenBurnerAddress.slice(0, 8)}...{tokenBurnerAddress.slice(-6)}</code>
          </div>
        </div>
        <a
          href={`https://scan.botchain.ai/address/${tokenBurnerAddress}#code`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          📜 Contract Code ↗
        </a>
      </div>

      {/* Target Token Input */}
      <div className="form-group">
        <label className="form-label">ERC-20 Token Address</label>
        <input
          className="form-input"
          type="text"
          placeholder="0x..."
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value.trim())}
          disabled={isBurning || isApproving}
          spellCheck={false}
        />
      </div>

      {/* Checking Status */}
      {isChecking && (
        <div className="burn-status checking">
          <span className="spinner-inline"></span>
          Probing token compatibility via TokenBurner contract on BotChain...
        </div>
      )}

      {/* Token Details & Compatibility Results */}
      {tokenInfo && !isChecking && (
        <>
          {/* Token Stats Grid */}
          <div className="token-info-grid">
            <div className="token-stat">
              <div className="token-stat-label">Token Name</div>
              <div className="token-stat-value">{tokenInfo.name}</div>
            </div>
            <div className="token-stat">
              <div className="token-stat-label">Symbol</div>
              <div className="token-stat-value accent">{tokenInfo.symbol}</div>
            </div>
            <div className="token-stat">
              <div className="token-stat-label">Decimals</div>
              <div className="token-stat-value">{tokenInfo.decimals}</div>
            </div>
          </div>

          <div className="token-info-grid" style={{ marginTop: 12 }}>
            <div className="token-stat" style={{ flex: 1 }}>
              <div className="token-stat-label">Total Supply</div>
              <div className="token-stat-value" style={{ fontSize: 14 }}>
                {parseFloat(tokenInfo.totalSupply).toLocaleString(undefined, { maximumFractionDigits: 4 })} {tokenInfo.symbol}
              </div>
            </div>
            <div className="token-stat" style={{ flex: 1, gridColumn: 'span 2' }}>
              <div className="token-stat-label">Your Wallet Balance</div>
              <div className="token-stat-value accent" style={{ fontSize: 16 }}>
                {parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenInfo.symbol}
              </div>
            </div>
          </div>

          {/* Compatibility Banner */}
          {isBurnable ? (
            <div className="burn-status burnable">
              ✅ Compatible: Token supports standard <strong>{supportsNativeBurn ? 'burn(uint256)' : 'burnFrom(address,uint256)'}</strong>. TokenBurner will permanently decrement total supply.
            </div>
          ) : (
            <div className="burn-status not-burnable">
              ⚠️ Token does not expose a native <code>burn()</code> function. TokenBurner will lock the tokens permanently in the <strong>Dead Address (0x0...dEaD)</strong>.
            </div>
          )}

          {/* Execution Mode Toggle */}
          <div style={{
            marginTop: 18,
            padding: '12px 16px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Target Smart Contract
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {useContractHelper
                  ? `TokenBurner.sol (${tokenBurnerAddress.slice(0, 8)}...${tokenBurnerAddress.slice(-6)}) - Emits TokensBurned event`
                  : 'Direct Token Contract'}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setUseContractHelper(!useContractHelper)}
              style={{ fontSize: 12 }}
            >
              {useContractHelper ? '✓ Contract Helper Active' : 'Direct Token Mode'}
            </button>
          </div>

          {/* Amount to Burn */}
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">Amount to Burn</label>
            <div className="input-with-action">
              <input
                className="form-input"
                type="number"
                placeholder="0.0"
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                disabled={isBurning || isApproving}
                min="0"
                step="any"
              />
              <button
                type="button"
                className="input-max-btn"
                onClick={() => setBurnAmount(balance || '0')}
                disabled={isBurning || isApproving || !balance || parseFloat(balance) === 0}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Burn Summary Preview */}
          {burnAmount && parseFloat(burnAmount) > 0 && (
            <div className="burn-preview">
              <div className="burn-preview-row">
                <span className="burn-preview-label">Asset</span>
                <span className="burn-preview-value">{tokenInfo.name} ({tokenInfo.symbol})</span>
              </div>
              <div className="burn-preview-row">
                <span className="burn-preview-label">Amount to Burn</span>
                <span className="burn-preview-value destructive">
                  🔥 {parseFloat(burnAmount).toLocaleString(undefined, { maximumFractionDigits: 8 })} {tokenInfo.symbol}
                </span>
              </div>
              <div className="burn-preview-row">
                <span className="burn-preview-label">Target Contract (To)</span>
                <span className="burn-preview-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  <a
                    href={`https://scan.botchain.ai/address/${useContractHelper ? tokenBurnerAddress : tokenInfo.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--red-400)', textDecoration: 'none' }}
                  >
                    {useContractHelper ? `TokenBurner (${tokenBurnerAddress.slice(0, 8)}...)` : `Token (${tokenInfo.address.slice(0, 8)}...)`} ↗
                  </a>
                </span>
              </div>
              <div className="burn-preview-row">
                <span className="burn-preview-label">Method Called</span>
                <span className="burn-preview-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {useContractHelper ? 'TokenBurner.burn(token, amount)' : (supportsNativeBurn ? 'token.burn(amount)' : 'token.transfer(dead, amount)')}
                </span>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="warning-box">
            <span className="warning-box-icon">⚠️</span>
            <div className="warning-box-text">
              <strong>Irreversible Supply Reduction:</strong> This will permanently destroy {burnAmount ? `${burnAmount} ${tokenInfo.symbol}` : 'tokens'} on BotChain Protocol. Burned tokens cannot be recovered.
            </div>
          </div>

          {/* Two-step Approve & Burn or Single Burn */}
          {needsApproval ? (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--yellow)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>ℹ️</span>
                <span>To burn through the contract, authorize <strong>TokenBurner</strong> to transfer the tokens for burning.</span>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onApprove}
                disabled={isApproving}
              >
                {isApproving ? (
                  <>
                    <span className="spinner"></span>
                    Approving TokenBurner Contract...
                  </>
                ) : (
                  <>🔑 Step 1: Approve TokenBurner ({tokenBurnerAddress.slice(0, 6)}...)</>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 20 }}
              disabled={!canBurn}
              onClick={onBurn}
            >
              {isBurning ? (
                <>
                  <span className="spinner"></span>
                  Executing Burn on TokenBurner Contract...
                </>
              ) : (
                <>🔥 Step 2: Burn {burnAmount && parseFloat(burnAmount) > 0 ? `${parseFloat(burnAmount).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${tokenInfo.symbol}` : 'Tokens'} via Contract</>
              )}
            </button>
          )}
        </>
      )}

      {/* Initial state before address input */}
      {!tokenAddress && !isChecking && (
        <div className="empty-state" style={{ padding: '36px 24px' }}>
          <div className="empty-state-icon">🪙</div>
          <div className="empty-state-title">Enter Token Contract Address</div>
          <div className="empty-state-desc">
            Provide the ERC-20 contract address on BotChain to query balances and burn tokens via <code>TokenBurner.sol</code>.
          </div>
        </div>
      )}
    </div>
  )
}
