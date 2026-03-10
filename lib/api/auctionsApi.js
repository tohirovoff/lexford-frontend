import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const auctionsApi = createApi({
  reducerPath: "auctionsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auctions", "AuctionItems"],

  endpoints: (builder) => ({
    // Barcha auksionlarni olish (filtr bilan qo'llab-quvvatlash mumkin)
    getAllAuctions: builder.query({
      query: () => "/auction", // User requested http://localhost:3000/auction
      providesTags: ["Auctions"],
    }),

    // Bitta auksion ma'lumotini olish
    getAuction: builder.query({
      query: (id) => `/auction/${id}`,
      providesTags: (result, error, id) => [{ type: "Auctions", id }],
    }),

    // Tanlangan auksionga tegishli barcha itemlarni olish
    getAuctionItems: builder.query({
      query: (auctionId) => `/auction-items?auction_id=${auctionId}`, // yoki "/auction/${auctionId}/items"
      providesTags: (result, error, auctionId) => [
        { type: "AuctionItems", id: `AUCTION-${auctionId}` },
      ],
    }),

    // Bitta item ma'lumotini olish (agar kerak bo'lsa)
    getAuctionItem: builder.query({
      query: (id) => `/auction-items/${id}`,
      providesTags: (result, error, id) => [{ type: "AuctionItems", id }],
    }),

    // Yangi auksion yaratish (Teacher/Admin)
    createAuction: builder.mutation({
      query: (data) => ({
        url: "/auction",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auctions"],
    }),

    // Auksionga item qo'shish
    createAuctionItem: builder.mutation({
      query: (data) => ({
        url: "/auction-items",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AuctionItems"],
    }),

    // Bid berish (Student)
    placeBid: builder.mutation({
      query: ({ itemId, amount }) => ({
        url: `/auction-items/${itemId}/bid`,
        method: "POST",
        body: { amount },
      }),
      invalidatesTags: (result, error, { itemId }) => [
        { type: "AuctionItems", id: itemId },
        "AuctionItems"
      ],
    }),
  }),
});

export const {
  useGetAllAuctionsQuery,
  useGetAuctionQuery,
  useGetAuctionItemsQuery,
  useGetAuctionItemQuery,
  useCreateAuctionMutation,
  useCreateAuctionItemMutation,
  usePlaceBidMutation,
} = auctionsApi;