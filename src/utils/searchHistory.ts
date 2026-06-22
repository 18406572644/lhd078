const SEARCH_HISTORY_KEY = 'search_history'
const MAX_HISTORY_LENGTH = 10

export function getSearchHistory(): string[] {
  try {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch {
    /* ignore */
  }
  return []
}

export function addSearchHistory(keyword: string): void {
  if (!keyword || !keyword.trim()) return
  const trimmed = keyword.trim()
  const history = getSearchHistory()
  const filtered = history.filter(item => item.toLowerCase() !== trimmed.toLowerCase())
  filtered.unshift(trimmed)
  const limited = filtered.slice(0, MAX_HISTORY_LENGTH)
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limited))
}

export function removeSearchHistory(keyword: string): void {
  const history = getSearchHistory()
  const filtered = history.filter(item => item.toLowerCase() !== keyword.toLowerCase())
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered))
}

export function clearSearchHistory(): void {
  localStorage.removeItem(SEARCH_HISTORY_KEY)
}
