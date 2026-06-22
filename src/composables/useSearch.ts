import { ref } from 'vue'
import { useApi } from './useApi'
import { getSearchHistory, addSearchHistory, removeSearchHistory, clearSearchHistory } from '@/utils/searchHistory'

export function useSearch() {
  const { api } = useApi()
  const searchHistory = ref<string[]>([])
  const hotKeywords = ref<{ keyword: string; search_count: number }[]>([])

  const loadSearchHistory = () => {
    searchHistory.value = getSearchHistory()
  }

  const addToHistory = (keyword: string) => {
    if (!keyword || !keyword.trim()) return
    addSearchHistory(keyword)
    loadSearchHistory()
  }

  const removeFromHistory = (keyword: string) => {
    removeSearchHistory(keyword)
    loadSearchHistory()
  }

  const clearHistory = () => {
    clearSearchHistory()
    loadSearchHistory()
  }

  const fetchHotKeywords = async (limit: number = 10) => {
    try {
      const { data } = await api.get('/tools/hot-keywords', { params: { limit } })
      hotKeywords.value = data?.data || []
    } catch {
      hotKeywords.value = []
    }
  }

  const initSearch = async (hotLimit: number = 10) => {
    loadSearchHistory()
    await fetchHotKeywords(hotLimit)
  }

  return {
    searchHistory,
    hotKeywords,
    loadSearchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    fetchHotKeywords,
    initSearch,
  }
}
