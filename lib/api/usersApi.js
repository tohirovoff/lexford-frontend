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
    updateStudentClass: builder.mutation({
      query: ({ id, class_id }) => ({
        url: `/user/${id}/class`,
        method: "PATCH",
        body: { class_id },
      }),
      invalidatesTags: (result, error, { id }) => [
        "Users",
        { type: "Users", id },
      ],
    }),
    createUser: builder.mutation({
      query: (data) => ({
        url: "/user/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Users", "Leaderboard"],
    }),
    createManyUsers: builder.mutation({
      query: (data) => ({
        url: "/user/create-many",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Users", "Leaderboard"],
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
    adminResetPassword: builder.mutation({
      query: ({ id, newPassword }) => ({
        url: `/user/${id}/reset-password`,
        method: "POST",
        body: { newPassword },
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
  useUpdateStudentClassMutation,
  useCreateUserMutation,
  useCreateManyUsersMutation,
  useDeleteUserMutation,
  useChangePasswordMutation,
  useAdminResetPasswordMutation,
  useGetSchoolLeaderboardQuery,
} = usersApi;
