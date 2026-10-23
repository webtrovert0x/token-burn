import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Read deployed address from src/config/contractAddress.js or argument
function getContractAddress() {
  if (process.argv[2] && process.argv[2].startsWith('0x')) {
    return process.argv[2]
  }
  const configPath = path.resolve(__dirname, '../src/config/contractAddress.js')
  const content = fs.readFileSync(configPath, 'utf8')
  const match = content.match(/'(0x[a-fA-F0-9]{40})'/)
  if (match) return match[1]
  throw new Error('No contract address found. Please deploy first or provide address as argument.')
}

const contractAddress = getContractAddress()
console.log(`\n🔍 Verifying TokenBurner contract on BotChain Mainnet at: ${contractAddress}`)

const sourcePath = path.resolve(__dirname, '../contracts/TokenBurner.sol')
const sourceCode = fs.readFileSync(sourcePath, 'utf8')

const compilerVersion = 'v0.8.20+commit.a1b79de6'

async function verifyBlockscoutV2() {
  console.log(`Submitting verification via Blockscout v2 API on BotChain Mainnet...`)
  const url = `https://scan.botchain.ai/api/v2/smart-contracts/${contractAddress}/verification/via/flattened-code`

  const payload = {
    compiler_version: compilerVersion,
    source_code: sourceCode,
    is_optimization_enabled: true,
    optimization_runs: 200,
    contract_name: 'TokenBurner',
    autodetect_constructor_args: true,
    evm_version: 'default',
    license_type: 'mit',
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return { ok: res.ok, status: res.status, json }
  } catch {
    return { ok: res.ok, status: res.status, raw: text }
  }
}

async function verifyEtherscanCompat() {
  console.log(`Submitting verification via Etherscan-compatible API on BotChain Mainnet...`)
  const url = `https://scan.botchain.ai/api`

  const params = new URLSearchParams()
  params.append('module', 'contract')
  params.append('action', 'verifysourcecode')
  params.append('contractaddress', contractAddress)
  params.append('sourceCode', sourceCode)
  params.append('contractname', 'TokenBurner')
  params.append('compilerversion', compilerVersion)
  params.append('optimizationUsed', '1')
  params.append('runs', '200')
  params.append('evmversion', 'default')
  params.append('licenseType', '3')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return { ok: res.ok, status: res.status, json }
  } catch {
    return { ok: res.ok, status: res.status, raw: text }
  }
}

async function checkStatus() {
  const checkUrl = `https://scan.botchain.ai/api?module=contract&action=getabi&address=${contractAddress}`
  const res = await fetch(checkUrl)
  const data = await res.json()
  return data.status === '1'
}

async function main() {
  console.log(`Compiler version: ${compilerVersion}`)
  console.log(`Optimization: Enabled (runs: 200)`)
  console.log(`License: MIT`)

  // Try Blockscout v2 first
  const v2Res = await verifyBlockscoutV2()
  console.log('Blockscout v2 response:', JSON.stringify(v2Res, null, 2))

  if (!v2Res.ok) {
    console.log('\nTrying fallback via standard Etherscan endpoint...')
    const ethRes = await verifyEtherscanCompat()
    console.log('Etherscan endpoint response:', JSON.stringify(ethRes, null, 2))
  }

  // Poll for verification status
  console.log('\nChecking verification status on-chain...')
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const isVerified = await checkStatus()
    if (isVerified) {
      console.log(`\n✅ Contract verified successfully on BotChain Mainnet!`)
      console.log(`View on Explorer: https://scan.botchain.ai/address/${contractAddress}#code`)
      return
    }
    process.stdout.write('.')
  }

  console.log(`\nVerification submitted. Check status at: https://scan.botchain.ai/address/${contractAddress}#code`)
}

main().catch(console.error)
