import { z } from 'zod';

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string({ message: 'Tên khóa học là bắt buộc' }).min(3, 'Tên khóa học ít nhất 3 ký tự'),
    code: z.string({ message: 'Mã khóa học là bắt buộc' }).min(2, 'Mã khóa học ít nhất 2 ký tự'),
    level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1', 'Kaiwa'], { message: 'Trình độ tiếng Nhật không hợp lệ' }),
    description: z.string().optional(),
    tuitionFee: z.number({ message: 'Học phí phải là số' }).min(0, 'Học phí không thể âm'),
    duration: z.string().optional(),
    schedule: z.string().optional(),
    maxStudents: z.number().optional(),
    startDate: z.string().optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    code: z.string().min(2).optional(),
    level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1', 'Kaiwa']).optional(),
    description: z.string().optional(),
    tuitionFee: z.number().min(0).optional(),
    duration: z.string().optional(),
    schedule: z.string().optional(),
    maxStudents: z.number().optional(),
    startDate: z.string().optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
  }),
});
