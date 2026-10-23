import { TOKEN_BURNER_ADDRESS } from '../config/contractAddress'

export default function Footer() {
  return (
    <footer className="footer-ecosystem">
      <div className="footer-container">
        {/* BOT Chain Ecosystem Showcase Section */}
        <div className="ecosystem-card">
          <div className="ecosystem-brand">
            <img
              src="/botchain_logo.jpeg"
              alt="BOT Chain Logo"
              className="ecosystem-logo"
            />
            <div>
              <div className="ecosystem-title-row">
                <span className="ecosystem-name">BOT Chain</span>
                <span className="ecosystem-badge">Mainnet 677</span>
              </div>
              <p className="ecosystem-desc">
                High-performance EVM Layer-1 Protocol powering next-generation Web3 automation & supply infrastructure.
              </p>
            </div>
          </div>

          <div className="ecosystem-links-wrapper">
            {/* BOT Chain Logo placed directly at the front of the links */}
            <div className="links-lead">
              <img
                src="/botchain_logo.jpeg"
                alt="BOT Chain Logo"
                className="links-lead-logo"
              />
              <span className="links-lead-text">Official BOT Chain Links:</span>
            </div>

            <div className="ecosystem-links">
              <a
                href="https://botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="ecosystem-link-btn"
              >
                <img
                  src="/botchain_logo.jpeg"
                  alt="BOT Chain"
                  className="link-inline-logo"
                />
                <span>BOT Chain website: <strong>https://botchain.ai</strong></span>
              </a>

              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="ecosystem-link-btn"
              >
                <img
                  src="/botchain_logo.jpeg"
                  alt="BOT Chain"
                  className="link-inline-logo"
                />
                <span>BOT Chain explorer: <strong>https://scan.botchain.ai</strong></span>
              </a>

              {TOKEN_BURNER_ADDRESS && (
                <a
                  href={`https://scan.botchain.ai/address/${TOKEN_BURNER_ADDRESS}#code`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ecosystem-link-btn contract-link"
                >
                  <span>📜 Verified TokenBurner Contract ↗</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bottom info */}
        <div className="footer-bottom">
          <div className="footer-bottom-brand">
            <img
              src="/botchain_logo.jpeg"
              alt="BOT Chain"
              className="footer-mini-logo"
            />
            <p>
              <strong>BOT Token Burner</strong> &middot; Built on{' '}
              <a href="https://botchain.ai" target="_blank" rel="noopener noreferrer">
                BOT Chain
              </a>
            </p>
          </div>
          <div className="footer-bottom-links">
            <a href="https://botchain.ai" target="_blank" rel="noopener noreferrer">
              BOT Chain: https://botchain.ai
            </a>
            <span>&bull;</span>
            <a href="https://scan.botchain.ai" target="_blank" rel="noopener noreferrer">
              Explorer: https://scan.botchain.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
