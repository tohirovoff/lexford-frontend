import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

/**
 * Attendance API - Davomat boshqarish uchun API
 * 
 * Coin mantiqiy:
 * - present_student_ids = +5 coin (kelganlar)
 * - late_student_ids = 0 coin (kechikkanlar)
 * - Kelmagan o'quvchilar = -5 coin (avtomatik hisoblanadi)
 */
export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Attendance", "AttendanceHistory", "TodayAttendance", "StudentStats"],

  endpoints: (builder) => ({
    // ===== QUERY ENDPOINTS =====

    /**
     * 3️⃣ BARCHA DAVOMATLARNI OLISH
     * GET /attendance
     * Authorization: Bearer <teacher_token>
     */
    getAllAttendance: builder.query({
      query: () => "/attendance",
      providesTags: ["Attendance"],
    }),

    /**
     * 4️⃣ BITTA DAVOMATNI OLISH
     * GET /attendance/:id
     * Authorization: Bearer <token>
     */
    getAttendance: builder.query({
      query: (id) => `/attendance/${id}`,
      providesTags: (result, error, id) => [{ type: "Attendance", id }],
    }),

    /**
     * 5️⃣ BUGUNGI SINF DAVOMATINI OLISH
     * GET /attendance/class/:class_id/today
     * Authorization: Bearer <teacher_token>
     */
    getTodayAttendance: builder.query({
      query: (classId) => `/attendance/class/${classId}/today`,
      providesTags: (result, error, classId) => [
        { type: "TodayAttendance", id: classId },
      ],
    }),

    /**
     * Sinf bo'yicha davomat tarixi
     * Backend'da alohida /history endpoint yo'q, shuning uchun
     * GET /attendance dan olib, frontend'da filtrlash kerak
     */
    getAttendanceHistory: builder.query({
      query: () => `/attendance`,
      transformResponse: (response, meta, arg) => {
        // Filter by class_id on frontend since backend doesn't have /history endpoint
        const data = Array.isArray(response) ? response : response?.data || [];
        if (arg?.classId) {
          return data.filter((record) => 
            record.class_id === arg.classId || 
            record.class_id === String(arg.classId)
          );
        }
        return data;
      },
      providesTags: (result, error, arg) => [
        "Attendance",
        { type: "AttendanceHistory", id: arg?.classId || arg?.class_id },
      ],
    }),

    /**
     * O'quvchi bo'yicha davomat tarixi
     * GET /attendance/student/:student_id/history
     */
    getStudentAttendanceHistory: builder.query({
      query: (studentId) => `/attendance/student/${studentId}/history`,
      providesTags: (result, error, studentId) => [
        { type: "Attendance", id: `STUDENT-${studentId}` },
      ],
    }),

    /**
     * 6️⃣ O'QUVCHI STATISTIKASI
     * GET /attendance/stats/student/:student_id
     * Authorization: Bearer <token>
     * 
     * Javob:
     * {
     *   "student_id": 15,
     *   "total_days_present": 25,
     *   "total_days_attended": 25,
     *   "total_days_late": 3,
     *   "coins_from_attendance": 125,
     *   "total_coins": 340,
     *   "recent_attendances": ["2026-02-07", "2026-02-06", ...],
     *   "recent_late_days": ["2026-02-05", ...]
     * }
     */
    getStudentStats: builder.query({
      query: (studentId) => `/attendance/stats/student/${studentId}`,
      providesTags: (result, error, studentId) => [
        { type: "StudentStats", id: studentId },
      ],
    }),

    // ===== MUTATION ENDPOINTS =====

    /**
     * 1️⃣ DAVOMAT YARATISH (Sinf rahbari uchun)
     * POST /attendance
     * Authorization: Bearer <teacher_token>
     * 
     * Body:
     * {
     *   "class_id": 1,
     *   "date": "2026-02-07",
     *   "subject": "Matematika",
     *   "present_student_ids": [5, 7, 8, 10],
     *   "late_student_ids": [3, 12]
     * }
     * 
     * Coin mantiqiy:
     * - present_student_ids = +5 coin (kelganlar)
     * - late_student_ids = 0 coin (kechikkanlar)
     * - Kelmagan o'quvchilar = -5 coin (avtomatik hisoblanadi)
     */
    createAttendance: builder.mutation({
      query: (data) => ({
        url: "/attendance",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { class_id }) => [
        "Attendance",
        { type: "TodayAttendance", id: class_id },
        { type: "AttendanceHistory", id: class_id },
        "StudentStats",
      ],
    }),

    /**
     * 2️⃣ KO'P DAVOMAT YARATISH
     * POST /attendance/create-many
     * Authorization: Bearer <teacher_token>
     * Body: CreateAttendanceDto array
     */
    createManyAttendance: builder.mutation({
      query: (data) => ({
        url: "/attendance/create-many",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Attendance", "TodayAttendance", "AttendanceHistory", "StudentStats"],
    }),

    /**
     * 7️⃣ DAVOMATNI YANGILASH (Sinf rahbari)
     * PATCH /attendance/:id
     * Authorization: Bearer <teacher_token>
     * 
     * Body:
     * {
     *   "present_student_ids": [5, 7, 8, 10, 15],
     *   "late_student_ids": [3]
     * }
     */
    updateAttendance: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/attendance/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Attendance", id: arg.id },
        "Attendance",
        { type: "TodayAttendance", id: arg.class_id || arg.classId },
        { type: "AttendanceHistory", id: arg.class_id || arg.classId },
        "StudentStats",
      ],
    }),

    /**
     * 8️⃣ DAVOMATNI O'CHIRISH (Sinf rahbari)
     * DELETE /attendance/:id
     * Authorization: Bearer <teacher_token>
     */
    deleteAttendance: builder.mutation({
      query: (id) => ({
        url: `/attendance/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Attendance", id },
        "Attendance",
        "TodayAttendance",
        "AttendanceHistory",
        "StudentStats",
      ],
    }),
  }),
});

export const {
  // Queries
  useGetAllAttendanceQuery,
  useGetAttendanceQuery,
  useGetTodayAttendanceQuery,
  useGetAttendanceHistoryQuery,
  useGetStudentAttendanceHistoryQuery,
  useGetStudentStatsQuery,

  // Mutations
  useCreateAttendanceMutation,
  useCreateManyAttendanceMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
} = attendanceApi;