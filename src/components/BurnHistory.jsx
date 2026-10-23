import { useMemo } from 'react'

export default function BurnHistory({ history, onClearHistory }) {
  const formatDate = (iso) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ' ' + d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const shortenHash = (hash) => {
    if (!hash) return ''
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

  const totalTokensBurned = useMemo(() => {
    return history
      .filter((h) => h.status === 'success')
      .reduce((acc, h) => acc + (parseFloat(h.amount) || 0), 0)
  }, [history])

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">📋</div>
        <div style={{ flex: 1 }}>
          <div className="card-title">Burn Transaction History</div>
          <div className="card-subtitle">
            {history.length > 0
              ? `${history.length} burn transaction${history.length !== 1 ? 's' : ''} logged`
              : 'No burns executed yet'}
          </div>
        </div>
        {history.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--red-400)', fontWeight: 600 }}>
              Total: 🔥 {totalTokensBurned.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClearHistory}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔥</div>
          <div className="empty-state-title">No Burns Yet</div>
          <div className="empty-state-desc">
            Transactions executed on BotChain Protocol will be tracked here with verified explorer links.
          </div>
        </div>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Amount Burned</th>
                <th>Mechanism</th>
                <th>Transaction</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {entry.tokenSymbol || 'Token'}
                      </span>
                      <a
                        href={`https://scan.botchain.ai/address/${entry.tokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hash-link"
                        style={{ fontSize: 11 }}
                      >
                        {entry.tokenAddress.slice(0, 8)}...{entry.tokenAddress.slice(-4)} ↗
                      </a>
                    </div>
                  </td>
                  <td className="amount-cell">
                    🔥 {parseFloat(entry.amount).toLocaleString(undefined, {
                      maximumFractionDigits: 8,
                    })} {entry.tokenSymbol}
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      padding: '2px 6px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 4,
                      color: 'var(--text-secondary)'
                    }}>
                      {entry.method || 'burn()'}
                    </span>
                  </td>
                  <td>
                    <a
                      href={`https://scan.botchain.ai/tx/${entry.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hash-link"
                    >
                      {shortenHash(entry.txHash)} ↗
                    </a>
                  </td>
                  <td style={{ fontSize: 12 }}>{formatDate(entry.timestamp)}</td>
                  <td>
                    <span className={`badge ${entry.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                      {entry.status === 'success' ? '✓ Confirmed' : '✗ Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
