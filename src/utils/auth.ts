export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function setAuth(token: string, user: any) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getUser() {
  const saved = localStorage.getItem('user')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  }
  return null
}
