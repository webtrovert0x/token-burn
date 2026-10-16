import fs from 'fs'
import path from 'path'
import solc from 'solc'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Read .env manually
function getEnvConfig() {
  const envPath = path.resolve(__dirname, '../.env')
  if (!fs.existsSync(envPath)) return {}
  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const [key, ...vals] = trimmed.split('=')
    env[key.trim()] = vals.join('=').trim()
  })
  return env
}

const env = getEnvConfig()
const rawKey = env.PRIVATE_KEY || process.env.PRIVATE_KEY || env.VITE_PRIVATE_KEY

if (!rawKey || rawKey === 'your_private_key_here') {
  console.error('\n❌ Please provide a valid private key in .env (PRIVATE_KEY)\n')
  process.exit(1)
}

const formattedKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`
const account = privateKeyToAccount(formattedKey)

const botChain = {
  id: 968,
  name: 'BOT Testnet',
  nativeCurrency: { decimals: 18, name: 'BOT', symbol: 'BOT' },
  rpcUrls: { default: { http: ['https://rpc.bohr.life'] } },
}

const client = createWalletClient({
  account,
  chain: botChain,
  transport: http('https://rpc.bohr.life'),
})

const publicClient = createPublicClient({
  chain: botChain,
  transport: http('https://rpc.bohr.life'),
})

async function compileContract() {
  console.log('Compiling contracts/TokenBurner.sol...')
  const sourcePath = path.resolve(__dirname, '../contracts/TokenBurner.sol')
  const source = fs.readFileSync(sourcePath, 'utf8')

  const input = {
    language: 'Solidity',
    sources: {
      'TokenBurner.sol': { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  }

  const output = JSON.parse(solc.compile(JSON.stringify(input)))
  if (output.errors) {
    for (const err of output.errors) {
      if (err.severity === 'error') {
        throw new Error(err.formattedMessage)
      } else {
        console.warn(err.formattedMessage)
      }
    }
  }

  const contract = output.contracts['TokenBurner.sol']['TokenBurner']
  return {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  }
}

async function main() {
  console.log(`\nDeploying from deployer account: ${account.address}`)

  const balance = await publicClient.getBalance({ address: account.address })
  console.log(`Account BOT balance: ${balance} wei`)

  const { abi, bytecode } = await compileContract()

  console.log('Broadcasting deployment transaction...')
  const hash = await client.deployContract({
    abi,
    bytecode,
    account,
  })

  console.log(`Transaction sent: https://scan.bohr.life/tx/${hash}`)
  console.log('Waiting for receipt...')

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  const contractAddress = receipt.contractAddress

  console.log(`\n🎉 TokenBurner deployed to: ${contractAddress}`)
  console.log(`Explorer: https://scan.bohr.life/address/${contractAddress}`)

  // Save to config file
  const configPath = path.resolve(__dirname, '../src/config/contractAddress.js')
  fs.writeFileSync(
    configPath,
    `export const TOKEN_BURNER_ADDRESS = '${contractAddress}'\n`
  )
  console.log(`Saved to src/config/contractAddress.js`)
}

main().catch((err) => {
  console.error('\nDeployment error:', err)
  process.exit(1)
})
