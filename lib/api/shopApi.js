import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const shopApi = createApi({
  reducerPath: "shopApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ShopItems", "Purchases", "UserCoins", "Users"],
  endpoints: (builder) => ({
    getShopItems: builder.query({
      query: () => "/shop-items/all", // Admin/Teacher can see all, maybe Student too but usually they use /shop-items
      providesTags: ["ShopItems"],
    }),
    
    getActiveShopItems: builder.query({
      query: () => "/shop-items", 
      providesTags: ["ShopItems"],
    }),

    createShopItem: builder.mutation({
      query: (data) => {
        // FormData if submitting image
        return {
          url: "/shop-items",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["ShopItems"],
    }),

    updateShopItem: builder.mutation({
      query: ({ id, body }) => ({
        url: `/shop-items/${id}`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: ["ShopItems"],
    }),

    deleteShopItem: builder.mutation({
      query: (id) => ({
        url: `/shop-items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ShopItems"],
    }),

    buyItem: builder.mutation({
      query: (data) => ({
        url: "/purchases",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ShopItems", "Purchases", "Users"],
    }),

    getAllPurchases: builder.query({
      query: () => "/purchases/all",
      providesTags: ["Purchases"],
    }),

    getMyPurchases: builder.query({
      query: () => "/purchases/my",
      providesTags: ["Purchases"],
    }),

    updatePurchaseStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/purchases/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Purchases", "Users"],
    }),

    deletePurchase: builder.mutation({
      query: (id) => ({
        url: `/purchases/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Purchases"],
    }),
  }),
});

export const {
  useGetShopItemsQuery,
  useGetActiveShopItemsQuery,
  useCreateShopItemMutation,
  useUpdateShopItemMutation,
  useDeleteShopItemMutation,
  useBuyItemMutation,
  useGetAllPurchasesQuery,
  useGetMyPurchasesQuery,
  useUpdatePurchaseStatusMutation,
  useDeletePurchaseMutation,
} = shopApi;
