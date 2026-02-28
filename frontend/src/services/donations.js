import { getDonationsWallets } from '../api/http'

export async function fetchWallets() {
  try {
    const res = await getDonationsWallets()
    if (res && res.data) return res.data
    return { btc: '', usdt: '' }
  } catch (err) {
    console.warn('fetchWallets failed', err)
    return { btc: '', usdt: '' }
  }
}
