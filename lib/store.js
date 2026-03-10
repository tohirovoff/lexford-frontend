// lib/store.js
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { authApi } from "./api/authApi";
import { usersApi } from "./api/usersApi";
import { classesApi } from "./api/classesApi";
import { attendanceApi } from "./api/attendanceApi";
import { coinsApi } from "./api/coinsApi";
import { auctionsApi } from "./api/auctionsApi";

// Auth holatini boshlang'ich qiymatni olish
const getInitialAuthState = () => {
  if (typeof window === "undefined") {
    return { user: null, token: null, isAuthenticated: false };
  }

  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  return {
    user: userStr ? JSON.parse(userStr) : null,
    token: token || null,
    isAuthenticated: !!token,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialAuthState(),
  reducers: {
    setCredentials: (state, action) => {
      const { token, user } = action.payload;

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      if (typeof window !== "undefined") {
        // localStorage ga saqlash (frontend uchun qulay)
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Cookie ga ham saqlash (middleware/server uchun)
        const maxAge = 7 * 24 * 60 * 60; // 7 kun
        document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
        // Agar HTTPS ishlatayotgan bo'lsangiz quyidagini qo'shing:
        // ; Secure
      }
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Cookie ni o'chirish
        document.cookie =
          "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      }
    },

    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;

// Store yaratish
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [classesApi.reducerPath]: classesApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [coinsApi.reducerPath]: coinsApi.reducer,
    [auctionsApi.reducerPath]: auctionsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // RTK Query bilan bog'liq muammolarni oldini olish uchun
    }).concat(
      authApi.middleware,
      usersApi.middleware,
      classesApi.middleware,
      attendanceApi.middleware,
      coinsApi.middleware,
      auctionsApi.middleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});

// TypeScript uchun qulay bo'lishi mumkin (agar keyinchalik ishlatmoqchi bo'lsangiz)
export const dispatch = store.dispatch;
export const getState = store.getState;
