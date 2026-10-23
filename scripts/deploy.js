import fs from 'fs'
import path from 'path'
import solc from 'solc'
import { createWalletClient, createPublicClient, http, formatEther } from 'viem'
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
  id: 677,
  name: 'BotChain Mainnet',
  nativeCurrency: { decimals: 18, name: 'BOT', symbol: 'BOT' },
  rpcUrls: { default: { http: ['https://rpc.botchain.ai'] } },
}

const client = createWalletClient({
  account,
  chain: botChain,
  transport: http('https://rpc.botchain.ai'),
})

const publicClient = createPublicClient({
  chain: botChain,
  transport: http('https://rpc.botchain.ai'),
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
  console.log(`\n🚀 Deploying TokenBurner to BotChain Mainnet (Chain ID 677)`)
  console.log(`Deployer account: ${account.address}`)

  const balance = await publicClient.getBalance({ address: account.address })
  console.log(`Account BOT balance: ${formatEther(balance)} BOT`)

  const { abi, bytecode } = await compileContract()

  // Estimate exact gas and gas price to minimize fee
  const gasEstimate = await publicClient.estimateGas({
    account: account.address,
    data: bytecode,
  })
  const gasPrice = await publicClient.getGasPrice()
  const estCost = gasEstimate * gasPrice
  console.log(`Estimated gas units: ${gasEstimate.toString()}`)
  console.log(`Network gas price: ${gasPrice.toString()} wei (${formatEther(gasPrice * 1000000000n)} Gwei approx)`)
  console.log(`Estimated deployment fee: ~${formatEther(estCost)} BOT (optimized)`)

  console.log('Broadcasting deployment transaction...')
  // Add 10% gas margin to avoid out of gas without overpaying (unused gas is refunded)
  const gasLimit = (gasEstimate * 110n) / 100n

  const hash = await client.deployContract({
    abi,
    bytecode,
    account,
    gas: gasLimit,
    gasPrice,
  })

  console.log(`Transaction sent: https://scan.botchain.ai/tx/${hash}`)
  console.log('Waiting for receipt...')

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  const contractAddress = receipt.contractAddress

  console.log(`\n🎉 TokenBurner successfully deployed on Mainnet!`)
  console.log(`Contract Address: ${contractAddress}`)
  console.log(`Gas Used: ${receipt.gasUsed.toString()} units`)
  const actualCost = receipt.gasUsed * (receipt.effectiveGasPrice || gasPrice)
  console.log(`Actual Fee Spent: ${formatEther(actualCost)} BOT`)
  console.log(`Explorer: https://scan.botchain.ai/address/${contractAddress}`)

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
