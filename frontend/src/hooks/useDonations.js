import { useEffect, useState } from 'react'
import { fetchWallets } from '../services/donations'

export default function useDonations() {
  const [wallets, setWallets] = useState({ btc: '', usdt: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchWallets()
        if (!cancelled) setWallets({ btc: data.btc || '', usdt: data.usdt || '' })
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { wallets, loading, error }
}
