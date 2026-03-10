import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "./baseQuery"

export const classesApi = createApi({
  reducerPath: "classesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Classes"],
  endpoints: (builder) => ({
    getAllClasses: builder.query({
      query: () => "/class/getAll",
      providesTags: ["Classes"],
    }),
    getClass: builder.query({
      query: (id) => `/class/${id}`,
      providesTags: (result, error, id) => [{ type: "Classes", id }],
    }),
    createClass: builder.mutation({
      query: (data) => ({
        url: "/class",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Classes"],
    }),
    updateClass: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/class/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Classes"],
    }),
    deleteClass: builder.mutation({
      query: (id) => ({
        url: `/class/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Classes"],
    }),
    getClassLeaderboard: builder.query({
      query: (classId) => `/class/${classId}/leaderboard`,
      providesTags: (result, error, classId) => [{ type: "Classes", id: classId }],
    }),
    getClassesLeaderboard: builder.query({
      query: () => "/class/leaderboard",
      providesTags: ["Classes"],
    }),
  }),
})

export const {
  useGetAllClassesQuery,
  useGetClassQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useGetClassLeaderboardQuery,
  useGetClassesLeaderboardQuery,
} = classesApi
