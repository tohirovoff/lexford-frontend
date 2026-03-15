import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "./baseQuery"

export const schedulesApi = createApi({
  reducerPath: "schedulesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Schedules"],
  endpoints: (builder) => ({
    getScheduleByClass: builder.query({
      query: (classId) => `/schedules/${classId}`,
      providesTags: (result, error, classId) => [{ type: "Schedules", id: classId }],
    }),
    saveSchedule: builder.mutation({
      query: ({ classId, data }) => ({
        url: `/schedules/${classId}`,
        method: "POST",
        body: { data },
      }),
      invalidatesTags: (result, error, { classId }) => [{ type: "Schedules", id: classId }],
    }),
  }),
})

export const {
  useGetScheduleByClassQuery,
  useSaveScheduleMutation,
} = schedulesApi
