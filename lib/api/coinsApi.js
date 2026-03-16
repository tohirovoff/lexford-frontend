import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const coinsApi = createApi({
  reducerPath: "coinsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Transactions", "Balance", "Penalties", "Users", "Classes"],

  endpoints: (builder) => ({
    // Joriy foydalanuvchining barcha tranzaksiyalari (eng ko'p ishlatiladi)
    getMyTransactions: builder.query({
      query: () => "/coin-transactions/my-transactions",
      transformResponse: (response) => {
        return Array.isArray(response) ? response : response?.data || [];
      },
      providesTags: ["Transactions"],
    }),

    getAllTransactions: builder.query({
      query: () => "/coin-transactions",
      transformResponse: (response) => {
        return Array.isArray(response) ? response : response?.data || [];
      },
      providesTags: ["Transactions"],
    }),

    // Foydalanuvchi tranzaksiyalari (admin yoki o'qituvchi uchun)
    getUserTransactions: builder.query({
      query: (userId) => `/coin-transactions/user/${userId}`,
      providesTags: (result, error, userId) => [{ type: "Transactions", id: userId }],
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
      invalidatesTags: ["Transactions", "Balance", "Users", "Classes"],
    }),

    // Jarima qo'shish (o'qituvchi/admin)
    createPenalty: builder.mutation({
      query: (data) => ({
        url: "/penalties",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Penalties", "Transactions", "Balance", "Users", "Classes"],
    }),

    // Bir nechta tranzaksiya yaratish
    createManyTransactions: builder.mutation({
      query: (data) => ({
        url: "/coin-transactions/create-many",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Transactions", "Balance", "Users", "Classes"],
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
} = coinsApi;