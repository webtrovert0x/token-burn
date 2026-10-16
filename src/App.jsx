import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { formatUnits, parseUnits, getAddress, isAddress, maxUint256 } from 'viem'
import { Toaster, toast } from 'react-hot-toast'
import { ERC20_ABI, BURN_ABI, TOKEN_BURNER_ABI } from './config/abi'
import { TOKEN_BURNER_ADDRESS } from './config/contractAddress'
import BurnForm from './components/BurnForm'
import BurnHistory from './components/BurnHistory'
import ConnectPrompt from './components/ConnectPrompt'
import Header from './components/Header'

const BURN_HISTORY_KEY = 'bot_token_burn_history_v3'
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD'

function App() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenInfo, setTokenInfo] = useState(null)
  const [burnAmount, setBurnAmount] = useState('')
  const [balance, setBalance] = useState('0')
  const [allowance, setAllowance] = useState('0')
  const [isBurnable, setIsBurnable] = useState(null)
  const [useContractHelper, setUseContractHelper] = useState(true) // Defaults to interacting with TokenBurner.sol
  const [supportsNativeBurn, setSupportsNativeBurn] = useState(false)
  const [supportsBurnFrom, setSupportsBurnFrom] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isBurning, setIsBurning] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [burnHistory, setBurnHistory] = useState([])

  // Load burn history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BURN_HISTORY_KEY)
      if (stored) {
        setBurnHistory(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load burn history:', e)
    }
  }, [])

  // Save burn history
  const saveBurnHistory = useCallback((history) => {
    setBurnHistory(history)
    try {
      localStorage.setItem(BURN_HISTORY_KEY, JSON.stringify(history))
    } catch (e) {
      console.error('Failed to save history:', e)
    }
  }, [])

  // Check token allowance for the TokenBurner helper contract
  const fetchAllowance = useCallback(async (tokenAddr) => {
    if (!publicClient || !address || !tokenAddr || !TOKEN_BURNER_ADDRESS) return '0'
    try {
      const allowed = await publicClient.readContract({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, TOKEN_BURNER_ADDRESS],
      })
      return allowed.toString()
    } catch (e) {
      console.warn('Failed to fetch allowance:', e)
      return '0'
    }
  }, [publicClient, address])

  // Probe token on-chain
  const checkToken = useCallback(async () => {
    if (!tokenAddress || !publicClient || !address) {
      setTokenInfo(null)
      setBalance('0')
      setAllowance('0')
      setIsBurnable(null)
      setSupportsNativeBurn(false)
      setSupportsBurnFrom(false)
      return
    }

    if (!isAddress(tokenAddress)) {
      setTokenInfo(null)
      setIsBurnable(null)
      return
    }

    const validAddress = getAddress(tokenAddress)
    setIsChecking(true)

    try {
      // 1. Fetch standard ERC-20 metadata and user balance
      const [name, symbol, decimals, totalSupply, userBalance] = await Promise.all([
        publicClient.readContract({ address: validAddress, abi: ERC20_ABI, functionName: 'name' }).catch(() => 'Unknown Token'),
        publicClient.readContract({ address: validAddress, abi: ERC20_ABI, functionName: 'symbol' }).catch(() => 'TOKEN'),
        publicClient.readContract({ address: validAddress, abi: ERC20_ABI, functionName: 'decimals' }).catch(() => 18),
        publicClient.readContract({ address: validAddress, abi: ERC20_ABI, functionName: 'totalSupply' }).catch(() => 0n),
        publicClient.readContract({ address: validAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [address] }).catch(() => 0n),
      ])

      const dec = Number(decimals)
      const formattedBalance = formatUnits(userBalance, dec)
      const formattedSupply = formatUnits(totalSupply, dec)

      setTokenInfo({
        address: validAddress,
        name: String(name),
        symbol: String(symbol),
        decimals: dec,
        totalSupply: formattedSupply,
      })
      setBalance(formattedBalance)

      // 2. Query checkBurnable on the TokenBurner contract if available
      let hasBurn = false
      let hasBurnFrom = false
      if (TOKEN_BURNER_ADDRESS && isAddress(TOKEN_BURNER_ADDRESS)) {
        try {
          const res = await publicClient.readContract({
            address: TOKEN_BURNER_ADDRESS,
            abi: TOKEN_BURNER_ABI,
            functionName: 'checkBurnable',
            args: [validAddress],
          })
          if (Array.isArray(res)) {
            hasBurn = res[0]
            hasBurnFrom = res[1]
          }
        } catch (e) {
          console.warn('TokenBurner checkBurnable call failed, testing simulation directly:', e)
        }
      }

      // If checkBurnable view didn't confirm, simulate directly
      if (!hasBurn && !hasBurnFrom) {
        try {
          await publicClient.simulateContract({
            address: validAddress,
            abi: BURN_ABI,
            functionName: 'burn',
            args: [0n],
            account: address,
          })
          hasBurn = true
        } catch (err) {
          const msg = String(err?.message || '')
          if (msg.includes('revert') || msg.includes('execution') || msg.includes('insufficient')) {
            hasBurn = true
          }
        }

        try {
          await publicClient.simulateContract({
            address: validAddress,
            abi: BURN_ABI,
            functionName: 'burnFrom',
            args: [address, 0n],
            account: address,
          })
          hasBurnFrom = true
        } catch (err) {
          const msg = String(err?.message || '')
          if (msg.includes('revert') || msg.includes('execution') || msg.includes('insufficient') || msg.includes('allowance')) {
            hasBurnFrom = true
          }
        }
      }

      setSupportsNativeBurn(hasBurn)
      setSupportsBurnFrom(hasBurnFrom)
      setIsBurnable(hasBurn || hasBurnFrom)

      // 3. Fetch allowance for TokenBurner contract
      const currentAllowance = await fetchAllowance(validAddress)
      setAllowance(currentAllowance)
    } catch (err) {
      console.error('Token check failed:', err)
      toast.error('Could not verify token. Please ensure the contract exists on BOT network.')
      setTokenInfo(null)
      setIsBurnable(null)
    } finally {
      setIsChecking(false)
    }
  }, [tokenAddress, publicClient, address, fetchAllowance])

  // Debounced token verification
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tokenAddress && tokenAddress.length === 42) {
        checkToken()
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [tokenAddress, checkToken])

  // Does the user need to approve TokenBurner contract first?
  const needsApproval = useMemo(() => {
    if (!burnAmount || !tokenInfo || !useContractHelper) return false
    try {
      const parsed = parseUnits(burnAmount, tokenInfo.decimals)
      return BigInt(allowance) < parsed
    } catch {
      return false
    }
  }, [burnAmount, tokenInfo, useContractHelper, allowance])

  // Handle Token Approval for TokenBurner contract
  const handleApprove = async () => {
    if (!walletClient || !tokenInfo || !TOKEN_BURNER_ADDRESS) {
      toast.error('Wallet or TokenBurner contract not available')
      return
    }
    setIsApproving(true)
    const toastId = toast.loading(`Approving TokenBurner contract (${TOKEN_BURNER_ADDRESS.slice(0, 6)}...)...`)
    try {
      const hash = await walletClient.writeContract({
        address: tokenInfo.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [TOKEN_BURNER_ADDRESS, maxUint256],
      })
      toast.loading('Confirming approval on-chain...', { id: toastId })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status === 'success') {
        toast.success(`Approval confirmed! TokenBurner is authorized.`, { id: toastId })
        const allowed = await fetchAllowance(tokenInfo.address)
        setAllowance(allowed)
      } else {
        toast.error('Approval transaction failed.', { id: toastId })
      }
    } catch (err) {
      console.error('Approve failed:', err)
      toast.error(err?.shortMessage || err?.message || 'Approval rejected or failed.', { id: toastId })
    } finally {
      setIsApproving(false)
    }
  }

  // Handle Burning: Interacts with TokenBurner contract
  const handleBurn = async () => {
    if (!walletClient || !tokenInfo || !burnAmount) return

    const parsedAmount = parseUnits(burnAmount, tokenInfo.decimals)
    if (parsedAmount <= 0n) {
      toast.error('Please enter an amount greater than 0.')
      return
    }

    if (parsedAmount > parseUnits(balance, tokenInfo.decimals)) {
      toast.error('Burn amount exceeds your available balance.')
      return
    }

    setIsBurning(true)
    const toastId = toast.loading(
      useContractHelper
        ? `Burning via TokenBurner contract (${TOKEN_BURNER_ADDRESS.slice(0, 6)}...)...`
        : `Burning directly on token contract...`
    )

    try {
      let hash
      let mechanismUsed = 'TokenBurner Contract'

      if (useContractHelper) {
        // INTERACT WITH THE TOKENBURNER SMART CONTRACT
        if (!TOKEN_BURNER_ADDRESS || !isAddress(TOKEN_BURNER_ADDRESS)) {
          throw new Error('TokenBurner contract address is missing.')
        }

        console.log(`Calling TokenBurner.burn(${tokenInfo.address}, ${parsedAmount.toString()}) on ${TOKEN_BURNER_ADDRESS}`)
        hash = await walletClient.writeContract({
          address: TOKEN_BURNER_ADDRESS,
          abi: TOKEN_BURNER_ABI,
          functionName: 'burn',
          args: [tokenInfo.address, parsedAmount],
        })
        mechanismUsed = 'TokenBurner.sol'
      } else {
        // Direct fallback if user explicitly toggled off the contract helper
        if (supportsNativeBurn) {
          hash = await walletClient.writeContract({
            address: tokenInfo.address,
            abi: BURN_ABI,
            functionName: 'burn',
            args: [parsedAmount],
          })
          mechanismUsed = 'Direct burn()'
        } else {
          hash = await walletClient.writeContract({
            address: tokenInfo.address,
            abi: [
              {
                inputs: [
                  { name: 'recipient', type: 'address' },
                  { name: 'amount', type: 'uint256' },
                ],
                name: 'transfer',
                outputs: [{ name: '', type: 'bool' }],
                stateMutability: 'nonpayable',
                type: 'function',
              },
            ],
            functionName: 'transfer',
            args: [DEAD_ADDRESS, parsedAmount],
          })
          mechanismUsed = 'Direct Dead Transfer'
        }
      }

      toast.loading('Confirming transaction on BOT network...', { id: toastId })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status === 'success') {
        toast.success(`Successfully burned ${burnAmount} ${tokenInfo.symbol}! 🔥`, { id: toastId })

        const entry = {
          id: Date.now(),
          tokenAddress: tokenInfo.address,
          tokenSymbol: tokenInfo.symbol,
          tokenName: tokenInfo.name,
          amount: burnAmount,
          method: mechanismUsed,
          contractAddress: useContractHelper ? TOKEN_BURNER_ADDRESS : tokenInfo.address,
          txHash: hash,
          timestamp: new Date().toISOString(),
          status: 'success',
        }
        saveBurnHistory([entry, ...burnHistory])

        // Reset and re-fetch real token data
        setBurnAmount('')
        checkToken()
      } else {
        toast.error('Burn transaction reverted on-chain.', { id: toastId })
        const entry = {
          id: Date.now(),
          tokenAddress: tokenInfo.address,
          tokenSymbol: tokenInfo.symbol,
          tokenName: tokenInfo.name,
          amount: burnAmount,
          method: mechanismUsed,
          contractAddress: useContractHelper ? TOKEN_BURNER_ADDRESS : tokenInfo.address,
          txHash: hash,
          timestamp: new Date().toISOString(),
          status: 'failed',
        }
        saveBurnHistory([entry, ...burnHistory])
      }
    } catch (err) {
      console.error('Burn failed:', err)
      toast.error(err?.shortMessage || err?.message || 'Transaction failed or rejected.', { id: toastId })
    } finally {
      setIsBurning(false)
    }
  }

  return (
    <div className="app-wrapper">
      <Header />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'toast-custom',
          duration: 5000,
          style: {
            background: '#1a1a20',
            color: '#f1f1f3',
            border: '1px solid #2a2a34',
            borderRadius: '12px',
          },
        }}
      />

      <main className="main-content">
        {!isConnected ? (
          <ConnectPrompt />
        ) : (
          <>
            <div className="hero animate-in">
              <h1><span className="flame-icon">🔥</span> BOT Token Burner</h1>
              <p>
                Permanently reduce circulating supply of supported ERC-20 tokens through the verified{' '}
                <code>TokenBurner.sol</code> helper contract on BotChain Protocol.
              </p>
            </div>

            <div className="grid-layout">
              <div className="grid-full animate-in">
                <BurnForm
                  tokenAddress={tokenAddress}
                  setTokenAddress={setTokenAddress}
                  tokenInfo={tokenInfo}
                  burnAmount={burnAmount}
                  setBurnAmount={setBurnAmount}
                  balance={balance}
                  allowance={allowance}
                  isBurnable={isBurnable}
                  supportsNativeBurn={supportsNativeBurn}
                  supportsBurnFrom={supportsBurnFrom}
                  useContractHelper={useContractHelper}
                  setUseContractHelper={setUseContractHelper}
                  isChecking={isChecking}
                  isBurning={isBurning}
                  isApproving={isApproving}
                  needsApproval={needsApproval}
                  tokenBurnerAddress={TOKEN_BURNER_ADDRESS}
                  onApprove={handleApprove}
                  onBurn={handleBurn}
                />
              </div>

              <div className="grid-full animate-in">
                <BurnHistory
                  history={burnHistory}
                  onClearHistory={() => saveBurnHistory([])}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          BOT Token Burner &middot; Verified Contract:{' '}
          <a
            href={`https://scan.bohr.life/address/${TOKEN_BURNER_ADDRESS}#code`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>{TOKEN_BURNER_ADDRESS.slice(0, 8)}...{TOKEN_BURNER_ADDRESS.slice(-6)}</code> ↗
          </a>{' '}
          &middot; Powered by{' '}
          <a href="https://scan.bohr.life" target="_blank" rel="noopener noreferrer">
            BotChain Protocol
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
