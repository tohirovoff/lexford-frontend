import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const coinsApi = createApi({
  reducerPath: "coinsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Transactions", "Balance", "Penalties", "Users", "Classes"],

  endpoints: (builder) => ({
    // Joriy foydalanuvchining barcha tranzaksiyalari (eng ko'p ishlatiladi)
    getMyTransactions: builder.query({
      query: (params = {}) => {
        const { page = 1, limit = 50 } = params;
        return `/coin-transactions/my-transactions?page=${page}&limit=${limit}`;
      },
      providesTags: ["Transactions"],
    }),

    getAllTransactions: builder.query({
      query: (params = {}) => {
        const { page = 1, limit = 50 } = params;
        return `/coin-transactions?page=${page}&limit=${limit}`;
      },
      providesTags: ["Transactions"],
    }),

    // Foydalanuvchi tranzaksiyalari (admin yoki o'qituvchi uchun)
    getUserTransactions: builder.query({
      query: ({ userId, page = 1, limit = 50 }) => 
        `/coin-transactions/user/${userId}?page=${page}&limit=${limit}`,
      providesTags: (result, error, { userId }) => [{ type: "Transactions", id: userId }],
    }),

    // Joriy foydalanuvchi balansini olish (tez-tez yangilanadi)
    getMyBalance: builder.query({
      query: () => "/coin-transactions/my-balance", // yoki "/coin-transactions/balance/me"
      providesTags: ["Balance"],
    }),

    // Barcha jarimalar (admin uchun)
    getAllPenalties: builder.query({
      query: () => "/penalties",
      providesTags: ["Penalties"],
    }),

    // Yangi tranzaksiya yaratish (mukofot, jarima, transfer)
    createTransaction: builder.mutation({
      query: (data) => ({
        url: "/coin-transactions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Transactions", "Balance", "Users"],
    }),

    // Jarima qo'shish (o'qituvchi/admin)
    createPenalty: builder.mutation({
      query: (data) => ({
        url: "/penalties",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Penalties", "Transactions", "Balance", "Users"],
    }),

    // Bir nechta tranzaksiya yaratish
    createManyTransactions: builder.mutation({
      query: (data) => ({
        url: "/coin-transactions/create-many",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Transactions", "Balance", "Users"],
    }),

    // Foydalanuvchining haftalik o'zgarishi (foizda)
    getWeeklyChange: builder.query({
      query: (userId) => `/coin-transactions/weekly-change/${userId}`,
      providesTags: ["Transactions"],
    }),

    // Haftalik top 10 tanga ko'paygan talabalar
    getWeeklyTopGainers: builder.query({
      query: () => "/coin-transactions/weekly-top-gainers",
      providesTags: ["Transactions"],
    }),

    // === PENDING TRANSACTIONS (ADMIN UCHUN) ===
    getPendingTransactions: builder.query({
      query: () => "/coin-transactions/pending",
      providesTags: ["Transactions"],
    }),

    approveTransaction: builder.mutation({
      query: (id) => ({
        url: `/coin-transactions/approve/${id}`,
        method: "POST",
      }),
      invalidatesTags: ["Transactions", "Balance", "Users"],
    }),

    approveAllTransactions: builder.mutation({
      query: () => ({
        url: "/coin-transactions/approve-all",
        method: "POST",
      }),
      invalidatesTags: ["Transactions", "Balance", "Users"],
    }),

    rejectTransaction: builder.mutation({
      query: (id) => ({
        url: `/coin-transactions/reject/${id}`,
        method: "POST",
      }),
      invalidatesTags: ["Transactions", "Balance", "Users"],
    }),
  }),
});

export const {
  useGetMyTransactionsQuery,
  useGetUserTransactionsQuery,
  useGetMyBalanceQuery,
  useCreateTransactionMutation,
  useGetAllPenaltiesQuery,
  useCreatePenaltyMutation,
  useGetAllTransactionsQuery,
  useCreateManyTransactionsMutation,
  useGetWeeklyChangeQuery,
  useGetWeeklyTopGainersQuery,
  useGetPendingTransactionsQuery,
  useApproveTransactionMutation,
  useApproveAllTransactionsMutation,
  useRejectTransactionMutation,
} = coinsApi;