import { fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { API_BASE_URL } from "../constants"

// Base query with JWT token injection
export const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
    return headers
  },
})

// Base query with re-auth handling
export const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    api.dispatch({ type: "auth/logout" })
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }

  return result
}
