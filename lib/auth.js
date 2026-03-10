// Get token from localStorage
export const getToken = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken()
  return !!token
}

// Get user from localStorage
export const getUser = () => {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem("user")
  return user ? JSON.parse(user) : null
}

// Check if user has specific role
export const hasRole = (requiredRole) => {
  const user = getUser()
  if (!user) return false
  return user.role === requiredRole
}

// Check if user has any of the specified roles
export const hasAnyRole = (roles) => {
  const user = getUser()
  if (!user) return false
  return roles.includes(user.role)
}

// Decode JWT token (basic decode, no verification)
export const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}
