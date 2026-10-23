# BOT Token Burner 🔥
> A secure, verifiable interface and smart contract protocol for burning ERC-20 tokens and permanently reducing circulating supply on **BotChain Protocol Mainnet**.

[![Network: BotChain Mainnet 677](https://img.shields.io/badge/Network-BotChain_Mainnet_677-dc2626)](https://scan.botchain.ai/)
[![Contract Verified](https://img.shields.io/badge/Contract-Verified_on_BotChain_Scan-22c55e)](https://scan.botchain.ai/address/0x9dd5b94720462f3f2f76266c833cb6f19e22f312#code)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Overview

**Tool #16: BOT Token Burner** is a specialized decentralized utility designed for token projects and holders who want a convenient, reliable burn interface.

A generic helper contract cannot unilaterally force an arbitrary token to destroy its supply. `TokenBurner` addresses this by:
1. Dynamically checking whether the token contract supports native burning (`burn(uint256)` or `burnFrom(address, uint256)`).
2. Requesting required approvals if burning via allowance or through the helper contract.
3. Executing the appropriate burn method or a compatible burn mechanism (`0x...dEaD` transfer fallback).
4. Logging real-time burn transaction history with direct verification links on **BotChain Explorer**.

---

## 🔗 On-Chain Contract Information (BotChain Mainnet)

- **Contract Name:** `TokenBurner.sol`
- **Network:** BotChain Protocol Mainnet
- **Chain ID:** `677`
- **RPC Endpoint:** `https://rpc.botchain.ai`
- **Native Currency:** `BOT` (18 Decimals)
- **Total Supply:** `150,000,000 BOT`
- **Deployed Address:** [`0x9dd5b94720462f3f2f76266c833cb6f19e22f312`](https://scan.botchain.ai/address/0x9dd5b94720462f3f2f76266c833cb6f19e22f312#code)
- **Deployment Transaction:** [`0x8c421730a8e6006a7a9b3db3ea5e6bf96b26c6ded1aaf4e174f05ae004ff05c9`](https://scan.botchain.ai/tx/0x8c421730a8e6006a7a9b3db3ea5e6bf96b26c6ded1aaf4e174f05ae004ff05c9)
- **Explorer Verification:** Verified on [BotChain Scan](https://scan.botchain.ai/address/0x9dd5b94720462f3f2f76266c833cb6f19e22f312#code) (Solidity `v0.8.20`, Optimization 200 runs).

---

## 🌟 Key Features

- **Real On-Chain Integration:** Zero mock data. Queries live ERC-20 metadata (`name`, `symbol`, `decimals`, `totalSupply`, `balanceOf`) and probes function selectors directly on-chain.
- **Multi-Mechanism Burn Support:**
  - `burn(uint256)` — Native OpenZeppelin supply reduction.
  - `burnFrom(address, uint256)` — Allowance-based burn.
  - `TokenBurner.burn(token, amount)` — Routed through audited helper contract with `TokensBurned` events.
  - `0x0...dEaD` Transfer — Compatible fallback for non-burnable tokens.
- **Two-Step Approval Flow:** Automatically detects whether allowance is required and provides clean, guided approval execution.
- **Burn Transaction History:** Logs all transactions with token metadata, amount destroyed, execution method, and direct explorer links.
- **Grayish-Black & Crimson Design:** Sleek charcoal background with vibrant fire-red buttons and glow accents.
- **Reown AppKit + Wagmi v2:** Modern wallet connectivity with full multi-wallet support on BotChain Mainnet.

---

## 📁 Repository Structure

```
token-burn/
├── contracts/
│   └── TokenBurner.sol            # Smart contract helper & event logger
├── scripts/
│   ├── deploy.js                  # Gas-optimized deployment script for BotChain Mainnet
│   └── verify.js                  # Terminal verification script via Blockscout API
├── src/
│   ├── components/
│   │   ├── BurnForm.jsx           # Token address input & burn execution form
│   │   ├── BurnHistory.jsx        # Verified transaction history table
│   │   ├── ConnectPrompt.jsx      # Wallet connection CTA
│   │   └── Header.jsx             # Top bar with network status & contract link
│   ├── config/
│   │   ├── abi.js                 # ERC-20, Burn, and TokenBurner ABIs
│   │   ├── chain.js               # BotChain Mainnet (677) chain configuration
│   │   ├── contractAddress.js     # Export of deployed TokenBurner address
│   │   └── wagmi.js               # Reown AppKit & Wagmi adapter setup
│   ├── App.jsx                    # Core application logic & on-chain state
│   ├── index.css                  # Charcoal-black & red styling tokens
│   ├── main.jsx                   # React root entry point
│   └── tempo-stub.js              # Bundler resolver stub
├── .env.example                   # Safe environment template
├── .gitignore                     # Git ignore rules protecting private keys & secrets
├── package.json                   # Project scripts and dependencies
├── vite.config.js                 # Vite bundler configuration
└── WHITEPAPER.md                  # Detailed protocol technical whitepaper
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v18+` or `v20+`
- An EVM-compatible wallet (e.g. MetaMask) configured with BotChain Mainnet (Chain ID `677`)

### 2. Installation
```bash
git clone https://github.com/webtrovert0x/token-burn.git
cd token-burn
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your environment variables:
```env
# Reown AppKit Project ID (get from https://cloud.reown.com)
VITE_REOWN_PROJECT_ID=your_reown_project_id_here

# Deployer Private Key (Only needed if running deployment script from terminal)
PRIVATE_KEY=your_private_key_here
```

> **Security Note:** The `PRIVATE_KEY` variable is strictly reserved for server-side / Node.js deployment scripts. It is **never** prefixed with `VITE_` and is ignored by Git via `.gitignore`.

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5174/`.

---

## 🛠 Terminal Commands

### Compile & Deploy Contract (Gas-Optimized)
Deploys `TokenBurner.sol` to BotChain Mainnet with minimal gas fee:
```bash
npm run deploy
```

### Verify Contract on BotChain Scan
Submits source code and compiler metadata to the BotChain Scan API:
```bash
npm run verify
```
*(Optionally verify another address: `node scripts/verify.js 0xYourContractAddress`)*

### Build for Production
```bash
npm run build
```

---

## 🔒 Security & Privacy Audit

- **No Secrets in Bundle:** Checked and verified that no private keys or deployer secrets are included in the frontend client build.
- **Safe Environment Variables:** Only `VITE_REOWN_PROJECT_ID` is exposed to the client. Private keys are loaded strictly in Node scripts.
- **Git Protection:** `.gitignore` explicitly blocks `.env`, `*.env`, and `.env.*.local`.
- **Zero Custody:** The application and helper contracts do not custody user funds. Burns occur atomically.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
