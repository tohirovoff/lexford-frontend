import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Users", "Leaderboard"],
  endpoints: (builder) => ({
    getAllUsers: builder.query({
      query: () => "/user/getAll",
      providesTags: ["Users"],
    }),
    getUser: builder.query({
      query: (id) => `/user/${id}`,
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),
    updateUser: builder.mutation({
      query: ({ id, formData, ...data }) => ({
        url: `/user/${id}`,
        method: "PUT",
        body: formData || data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Users",
        { type: "Users", id },
      ],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/user/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => ["Users", { type: "Users", id }],
    }),
    changePassword: builder.mutation({
      query: (data) => ({
        url: "/user/change-password",
        method: "POST",
        body: data,
      }),
    }),
    getSchoolLeaderboard: builder.query({
      query: () => "/user/leaderboard/school",
      providesTags: ["Leaderboard"],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useChangePasswordMutation,
  useGetSchoolLeaderboardQuery,
} = usersApi;
